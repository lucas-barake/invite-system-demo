import { db } from "@/server/database";
import { TRPCError } from "@trpc/server";
import { Logger } from "@/server/api/common/logger";
import { DateTime } from "luxon";
import {
  type CheckGroupExistenceArgs,
  type CheckGroupMemberExistenceArgs,
  type CreateGroupArgs,
  type DeleteGroupArgs,
  type Group,
  type UndoDeleteGroupArgs,
} from "@/server/api/routers/groups/repository/groups.repository.types";

class GroupsRepository {
  private readonly logger = new Logger(GroupsRepository.name);

  public async createGroup(args: CreateGroupArgs): Promise<Group> {
    const group = await db
      .insertInto("groups")
      .values({
        title: args.input.title,
        owner_id: args.ownerId,
        updated_at: new Date(),
      })
      .returning(["created_at", "id", "title", "updated_at", "owner_id"])
      .executeTakeFirst();

    if (group === undefined) {
      this.logger.error("Failed to create group");
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create group",
      });
    }

    const owner = await db
      .selectFrom("users")
      .where("id", "=", args.ownerId)
      .select(["email", "name", "imageUrl", "id"])
      .executeTakeFirst();

    if (owner === undefined) {
      this.logger.error("Failed to fetch owner's information");
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch owner's information",
      });
    }

    return {
      ...group,
      members: [],
      owner: {
        email: owner.email,
        id: owner.id,
        name: owner.name,
        imageUrl: owner.imageUrl,
      },
    };
  }

  public async deleteGroup(args: DeleteGroupArgs): Promise<boolean> {
    return db
      .updateTable("groups")
      .where(({ eb, and }) =>
        and([
          eb("id", "=", args.groupId),
          eb("owner_id", "=", args.ownerId),
          eb("deleted_at", "is", null),
        ])
      )
      .set({ deleted_at: DateTime.now().toUTC().toISO() })
      .executeTakeFirst()
      .then((data) => Number(data.numUpdatedRows) > 0);
  }

  public async undoDeleteGroup(args: UndoDeleteGroupArgs): Promise<boolean> {
    const sevenDaysAgo = DateTime.now().minus({ days: 7 }).toUTC().toJSDate();
    return db
      .updateTable("groups")
      .where(({ eb, and }) =>
        and([
          eb("id", "=", args.groupId),
          eb("owner_id", "=", args.ownerId),
          eb("deleted_at", ">=", sevenDaysAgo),
        ])
      )
      .set({ deleted_at: null })
      .executeTakeFirst()
      .then((data) => Number(data.numUpdatedRows) === 1);
  }

  public async getGroupsByUserId(userId: string): Promise<Group[]> {
    const rows = await db
      .selectFrom("groups")
      .leftJoin("group_members", "group_members.group_id", "groups.id")
      .leftJoin("users as member", "member.id", "group_members.user_id")
      .innerJoin("users as owner", "owner.id", "groups.owner_id")
      .where(({ eb, or, and }) =>
        and([
          or([eb("groups.owner_id", "=", userId), eb("group_members.user_id", "=", userId)]),
          eb("groups.deleted_at", "is", null),
        ])
      )
      .select([
        "groups.created_at as group_created_at",
        "groups.updated_at as group_updated_at",
        "groups.owner_id as group_owner_id",
        "groups.title as group_title",
        "groups.id as group_id",
        "owner.email as owner_email",
        "owner.name as owner_name",
        "owner.imageUrl as owner_imageUrl",
        "owner.id as owner_id",
        "member.email as member_email",
        "member.name as member_name",
        "member.imageUrl as member_imageUrl",
        "member.id as member_id",
        "group_members.updated_at as member_updated_at",
      ])
      .orderBy("groups.updated_at", "desc")
      .execute();

    const groupsMap = new Map<string, Group>();

    for (const row of rows) {
      if (!groupsMap.has(row.group_id)) {
        groupsMap.set(row.group_id, {
          created_at: row.group_created_at,
          id: row.group_id,
          title: row.group_title,
          updated_at: row.group_updated_at,
          members: [],
          owner: {
            email: row.owner_email,
            id: row.owner_id,
            imageUrl: row.owner_imageUrl,
            name: row.owner_name,
          },
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const group = groupsMap.get(row.group_id)!;
      if (row.member_id !== null && row.member_email !== null) {
        group.members.push({
          email: row.member_email,
          id: row.member_id,
          imageUrl: row.member_imageUrl,
          name: row.member_name,
          updated_at: row.member_updated_at,
        });
      }
    }

    for (const group of groupsMap.values()) {
      group.members = group.members.filter((member) => member.id !== group.owner.id);
    }

    return Array.from(groupsMap.values());
  }

  public async checkGroupExistence(args: CheckGroupExistenceArgs): Promise<boolean> {
    const group = await db
      .selectFrom("groups")
      .where(({ eb, and }) => and([eb("id", "=", args.groupId), eb("owner_id", "=", args.ownerId)]))
      .select(["id"])
      .executeTakeFirst();
    return group !== undefined;
  }

  public async checkGroupMemberExistence(args: CheckGroupMemberExistenceArgs): Promise<boolean> {
    const member = await db
      .selectFrom("group_members")
      .leftJoin("users", "users.id", "group_members.user_id")
      .where(({ eb, and }) =>
        and([eb("group_id", "=", args.groupId), eb("users.email", "=", args.userEmail)])
      )
      .select("group_members.user_id")
      .executeTakeFirst();
    return member !== undefined;
  }
}

export const groupsRepository = new GroupsRepository();

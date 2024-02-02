import { type CreateGroupInputType } from "@/server/api/routers/groups/groups.input";
import { type Group } from "@/server/api/routers/groups/groups.types";
import { db } from "@/server/database";
import { TRPCError } from "@trpc/server";
import { Logger } from "@/server/api/common/logger";

class GroupsRepository {
  private readonly logger = new Logger(GroupsRepository.name);

  public async createGroup(input: CreateGroupInputType & { ownerId: string }): Promise<Group> {
    const group = await db
      .insertInto("groups")
      .values({
        title: input.title,
        owner_id: input.ownerId,
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
      .where("id", "=", input.ownerId)
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

  public async deleteGroup(groupId: string, ownerId: string): Promise<boolean> {
    const deleteResult = await db
      .deleteFrom("groups")
      .where(({ eb, and }) => and([eb("id", "=", groupId), eb("owner_id", "=", ownerId)]))
      .executeTakeFirst();
    return deleteResult.numDeletedRows === BigInt(1);
  }

  public async getGroupsByUserId(userId: string): Promise<Group[]> {
    const groupSelect = [
      "groups.created_at as group_created_at",
      "groups.updated_at as group_updated_at",
      "groups.owner_id as group_owner_id",
      "groups.title as group_title",
      "groups.id as group_id",
      "owner.email as owner_email",
      "owner.name as owner_name",
      "owner.imageUrl as owner_imageUrl",
      "owner.id as owner_id",
    ] as const;

    const rows = await db
      .selectFrom("groups")
      .leftJoin("group_members", "group_members.group_id", "groups.id")
      .leftJoin("users as member", "member.id", "group_members.user_id")
      .innerJoin("users as owner", "owner.id", "groups.owner_id")
      .where("groups.owner_id", "=", userId)
      .select([
        ...groupSelect,
        "member.email as member_email",
        "member.name as member_name",
        "member.imageUrl as member_imageUrl",
        "member.id as member_id",
        "group_members.updated_at as member_updated_at",
      ])
      .union((expr) =>
        expr
          .selectFrom("groups")
          .leftJoin("group_members", "group_members.group_id", "groups.id")
          .leftJoin("users as member", "member.id", "group_members.user_id")
          .innerJoin("users as owner", "owner.id", "groups.owner_id")
          .where("group_members.user_id", "=", userId)
          .select([
            ...groupSelect,
            "member.email as member_email",
            "member.name as member_name",
            "member.imageUrl as member_imageUrl",
            "member.id as member_id",
            "group_members.updated_at as member_updated_at",
          ])
      )
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

  public async checkGroupExistence(groupId: string, ownerId: string): Promise<boolean> {
    const group = await db
      .selectFrom("groups")
      .where(({ eb, and }) => and([eb("id", "=", groupId), eb("owner_id", "=", ownerId)]))
      .select(["id"])
      .executeTakeFirst();
    return group !== undefined;
  }

  public async checkGroupMemberExistence({
    groupId,
    userEmail,
  }: {
    groupId: string;
    userEmail: string;
  }): Promise<boolean> {
    const member = await db
      .selectFrom("group_members")
      .leftJoin("users", "users.id", "group_members.user_id")
      .where(({ eb, and }) =>
        and([eb("group_id", "=", groupId), eb("users.email", "=", userEmail)])
      )
      .select("group_members.user_id")
      .executeTakeFirst();
    return member !== undefined;
  }
}

export const groupsRepository = new GroupsRepository();

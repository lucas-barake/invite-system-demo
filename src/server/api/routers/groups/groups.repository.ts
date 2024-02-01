import { PostgresError } from "@/server/api/common/enums/postgres-error.enum";
import { userRepository } from "@/server/api/repositories/user-repository";
import { type CreateGroupInputType } from "@/server/api/routers/groups/groups.input";
import { type Group, type GroupInvite } from "@/server/api/routers/groups/groups.types";
import { db } from "@/server/database";
import { TRPCError } from "@trpc/server";
import { DatabaseError } from "pg";
import { Logger } from "@/server/api/common/logger";
import { DateTime } from "luxon";

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

  public async addMemberToGroup({
    groupId,
    userIdToAdd,
  }: {
    groupId: string;
    userIdToAdd: string;
  }): Promise<void> {
    await db.transaction().execute(async (trx) => {
      const group = await trx
        .selectFrom("groups")
        .where("id", "=", groupId)
        .select(["groups.id"])
        .executeTakeFirst();

      if (group === undefined) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not allowed to add members to this group",
        });
      }

      await trx
        .insertInto("group_members")
        .values({
          group_id: groupId,
          user_id: userIdToAdd,
          updated_at: new Date(),
        })
        .execute();
    });
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

  public async addPendingInvite({
    groupId,
    inviteeEmail,
    expirationTime,
  }: {
    groupId: string;
    inviteeEmail: string;
    expirationTime: Date;
  }): Promise<number> {
    try {
      return await db
        .insertInto("group_invites")
        .values({
          group_id: groupId,
          invitee_email: inviteeEmail,
          expiration_time: expirationTime,
        })
        .executeTakeFirst()
        .then((result) => Number(result.numInsertedOrUpdatedRows));
    } catch (error) {
      if (error instanceof DatabaseError && error.code === PostgresError.UNIQUE_VIOLATION) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invite already exists",
        });
      }
      this.logger.error(error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to add pending invite",
      });
    }
  }

  public async deletePendingInvite(groupId: string, inviteeEmail: string): Promise<number> {
    return db
      .deleteFrom("group_invites")
      .where(({ eb, and }) =>
        and([eb("group_id", "=", groupId), eb("invitee_email", "=", inviteeEmail)])
      )
      .executeTakeFirst()
      .then((result) => Number(result.numDeletedRows));
  }

  public async checkPendingInviteExistence(
    groupId: string,
    inviteeEmail: string
  ): Promise<boolean> {
    const invite = await db
      .selectFrom("group_invites")
      .where(({ eb, and }) =>
        and([eb("group_id", "=", groupId), eb("invitee_email", "=", inviteeEmail)])
      )
      .select(["group_id"])
      .executeTakeFirst();
    return invite !== undefined;
  }

  public async getPendingInvitesForUser(inviteeEmail: string): Promise<GroupInvite[]> {
    const currentTime = DateTime.now().toUTC().toJSDate();
    const invites = await db
      .selectFrom("group_invites")
      .where("invitee_email", "=", inviteeEmail)
      .where("expiration_time", ">", currentTime)
      .select(["group_id", "expiration_time"])
      .execute();

    const groupIds = invites.map((invite) => invite.group_id);
    if (groupIds.length === 0) {
      return [];
    }

    const groups = await db
      .selectFrom("groups")
      .where("id", "in", groupIds)
      .select(["id", "title", "owner_id"])
      .execute();
    const groupInvitesMap = new Map<string, GroupInvite>();
    for (const group of groups) {
      const owner = await userRepository.getUserById(group.owner_id);
      if (owner !== null) {
        groupInvitesMap.set(group.id, {
          groupId: group.id,
          title: group.title,
          owner: {
            email: owner.email,
            id: owner.id,
            imageUrl: owner.imageUrl,
            name: owner.name,
          },
        });
      }
    }

    return invites.map((invite) => groupInvitesMap.get(invite.group_id)!);
  }
}

export const groupsRepository = new GroupsRepository();

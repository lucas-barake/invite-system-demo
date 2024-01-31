import { userRepository } from "@/server/api/repositories/user-repository";
import { type CreateGroupInputType } from "@/server/api/routers/groups/groups.input";
import { type Group } from "@/server/api/routers/groups/groups.types";
import { db } from "@/server/database";
import { TRPCError } from "@trpc/server";

class GroupsRepository {
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

  public async getGroupsByUserId(userId: string): Promise<Group[]> {
    const groupSelect = [
      "groups.created_at",
      "groups.updated_at",
      "groups.owner_id",
      "groups.title",
      "groups.id",
      "users.email as member_email",
      "users.name as member_name",
      "users.imageUrl as member_imageUrl",
      "users.id as member_id",
      "group_members.updated_at as member_updated_at",
    ] as const;

    const rows = await db
      .selectFrom("groups")
      .leftJoin("group_members", "group_members.group_id", "groups.id")
      .leftJoin("users", "users.id", "group_members.user_id")
      .where("groups.owner_id", "=", userId)
      .select(groupSelect)
      .union((expr) =>
        expr
          .selectFrom("groups")
          .leftJoin("group_members", "group_members.group_id", "groups.id")
          .leftJoin("users", "users.id", "group_members.user_id")
          .where("group_members.user_id", "=", userId)
          .select(groupSelect)
      )
      .execute();

    const owner = await userRepository.getUserById(userId);
    if (owner === null) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch owner's information",
      });
    }

    const groupsMap = new Map<string, Group>();

    for (const row of rows) {
      if (!groupsMap.has(row.id)) {
        groupsMap.set(row.id, {
          created_at: row.created_at,
          id: row.id,
          title: row.title,
          updated_at: row.updated_at,
          members: [],
          owner: {
            email: owner.email,
            id: owner.id,
            imageUrl: owner.imageUrl,
            name: owner.name,
          },
        });
      }

      const group = groupsMap.get(row.id)!;
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

    return Array.from(groupsMap.values());
  }

  public async addMembersToGroup({
    ownerId,
    groupId,
    membersToBeAdded,
  }: {
    ownerId: string;
    groupId: string;
    membersToBeAdded: string[];
  }): Promise<void> {
    await db.transaction().execute(async (trx) => {
      const group = await trx
        .selectFrom("groups")
        .where("id", "=", groupId)
        .select(["owner_id"])
        .executeTakeFirst();

      if (group === undefined || group.owner_id !== ownerId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not allowed to add members to this group",
        });
      }

      const members = membersToBeAdded.map((memberId) => ({
        group_id: groupId,
        user_id: memberId,
        updated_at: new Date(),
      }));

      await trx.insertInto("group_members").values(members).execute();
    });
  }

  public async addMember({
    ownerId,
    groupId,
    memberEmail,
  }: {
    ownerId: string;
    groupId: string;
    memberEmail: string;
  }): Promise<void> {
    const member = await db
      .selectFrom("users")
      .where("email", "=", memberEmail)
      .select(["id"])
      .executeTakeFirst();

    if (member === undefined) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    await this.addMembersToGroup({
      ownerId,
      groupId,
      membersToBeAdded: [member.id],
    });
  }

  public async deleteGroup(groupId: string, ownerId: string): Promise<boolean> {
    const deleteResult = await db
      .deleteFrom("groups")
      .where(({ eb, and }) => and([eb("id", "=", groupId), eb("owner_id", "=", ownerId)]))
      .executeTakeFirst();
    return deleteResult.numDeletedRows === BigInt(1);
  }
}

export const groupsRepository = new GroupsRepository();

import { Logger } from "@/server/api/common/logger";
import { db } from "@/server/database";
import { TRPCError } from "@trpc/server";
import { DateTime } from "luxon";
import { userRepository } from "@/server/api/common/repositories/user.repository";
import { type GroupInvite } from "@/server/api/routers/groups/group-invites/group-invites.types";

class GroupInvitesRepository {
  private readonly logger = new Logger(GroupInvitesRepository.name);

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
      const existingInvite = await db
        .selectFrom("group_invites")
        .where("group_id", "=", groupId)
        .where("invitee_email", "=", inviteeEmail)
        .select(["expiration_time"])
        .executeTakeFirst();

      if (existingInvite === undefined) {
        return await db
          .insertInto("group_invites")
          .values({
            group_id: groupId,
            invitee_email: inviteeEmail,
            expiration_time: expirationTime,
          })
          .executeTakeFirst()
          .then(() => 1);
      }

      const currentTime = DateTime.now().toUTC();
      const existingExpirationTime = DateTime.fromJSDate(existingInvite.expiration_time).toUTC();
      if (currentTime <= existingExpirationTime.minus({ days: 2 })) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User already has a pending invite for this group",
        });
      }

      return await db
        .updateTable("group_invites")
        .set({
          expiration_time: expirationTime,
        })
        .where(({ eb, and }) =>
          and([eb("group_id", "=", groupId), eb("invitee_email", "=", inviteeEmail)])
        )
        .executeTakeFirst()
        .then(() => 1);
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      this.logger.error(error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to add or update pending invite",
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
        and([
          eb("group_id", "=", groupId),
          eb("invitee_email", "=", inviteeEmail),
          eb("expiration_time", ">", DateTime.now().toUTC().toJSDate()),
        ])
      )
      .select(["group_id"])
      .executeTakeFirst();
    return invite !== undefined;
  }

  public async getPendingInvitesForUser(inviteeEmail: string): Promise<GroupInvite[]> {
    const currentTime = DateTime.now().toUTC().toJSDate();
    const invites = await db
      .selectFrom("group_invites")
      .where(({ eb, and }) =>
        and([eb("invitee_email", "=", inviteeEmail), eb("expiration_time", ">", currentTime)])
      )
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

  public async getPendingInvitesForGroup(groupId: string): Promise<string[]> {
    const currentTime = DateTime.now().toUTC().toJSDate();
    const invites = await db
      .selectFrom("group_invites")
      .where("group_id", "=", groupId)
      .where("expiration_time", ">", currentTime)
      .select(["invitee_email", "expiration_time"])
      .execute();

    return invites.map((invite) => invite.invitee_email);
  }

  public async addMemberToGroupAndRemovePendingInvite({
    groupId,
    userIdToAdd,
    inviteeEmail,
  }: {
    groupId: string;
    userIdToAdd: string;
    inviteeEmail: string;
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

      await trx
        .deleteFrom("group_invites")
        .where(({ eb, and }) =>
          and([eb("group_id", "=", groupId), eb("invitee_email", "=", inviteeEmail)])
        )
        .execute();
    });
  }
}

export const groupInvitesRepository = new GroupInvitesRepository();

import { Logger } from "@/server/api/common/logger";
import { db } from "@/server/database";
import { DatabaseError } from "pg";
import { PostgresError } from "@/server/api/common/enums/postgres-error.enum";
import { TRPCError } from "@trpc/server";
import { DateTime } from "luxon";
import { userRepository } from "@/server/api/common/repositories/user-repository";
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

export const groupInvitesRepository = new GroupInvitesRepository();

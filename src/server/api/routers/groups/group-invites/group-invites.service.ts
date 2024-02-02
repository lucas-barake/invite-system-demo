import { Logger } from "@/server/api/common/logger";
import type { User } from "@/server/api/common/repositories/user-repository";
import { groupsRepository } from "@/server/api/routers/groups/groups.repository";
import { TRPCError } from "@trpc/server";
import { DateTime } from "luxon";
import { groupInvitesRepository } from "@/server/api/routers/groups/group-invites/group-invites.repository";
import {
  type AcceptGroupInviteInputType,
  type SendGroupInviteInputType,
} from "@/server/api/routers/groups/group-invites/group-invites.input";
import { type GroupInvite } from "@/server/api/routers/groups/group-invites/group-invites.types";

class GroupInvitesService {
  private readonly _logger = new Logger(GroupInvitesService.name);

  public async sendGroupInvite(input: SendGroupInviteInputType, session: User): Promise<true> {
    if (input.email === session.email) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You cannot invite yourself",
      });
    }

    const group = await groupsRepository.checkGroupExistence(input.groupId, session.id);
    if (!group) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Group not found or you are not the owner of the group",
      });
    }

    const memberExists = await groupsRepository.checkGroupMemberExistence({
      groupId: input.groupId,
      userEmail: input.email,
    });
    if (memberExists) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User is already a member of this group",
      });
    }

    const expirationTime = DateTime.now().plus({ days: 7 }).toUTC().toJSDate();
    await groupInvitesRepository.addPendingInvite({
      groupId: input.groupId,
      inviteeEmail: input.email,
      expirationTime,
    });

    return true;
  }

  public async acceptGroupInvite(input: AcceptGroupInviteInputType, session: User): Promise<true> {
    const pendingInviteExists = await groupInvitesRepository.checkPendingInviteExistence(
      input.groupId,
      session.email
    );
    if (!pendingInviteExists) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invite not found",
      });
    }

    const memberExists = await groupsRepository.checkGroupMemberExistence({
      groupId: input.groupId,
      userEmail: session.email,
    });
    if (memberExists) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You are already a member of this group",
      });
    }

    await groupInvitesRepository.addMemberToGroupAndRemovePendingInvite({
      groupId: input.groupId,
      userIdToAdd: session.id,
      inviteeEmail: session.email,
    });

    return true;
  }

  public async declineGroupInvite(groupId: string, session: User): Promise<boolean> {
    const result = await groupInvitesRepository.deletePendingInvite(groupId, session.email);
    return result !== 0;
  }

  public async removePendingInvite({
    groupId,
    inviteeEmail,
    session,
  }: {
    groupId: string;
    inviteeEmail: string;
    session: User;
  }): Promise<boolean> {
    const groupExists = await groupsRepository.checkGroupExistence(groupId, session.id);
    if (!groupExists) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Group not found or you are not the owner of the group",
      });
    }
    const result = await groupInvitesRepository.deletePendingInvite(groupId, inviteeEmail);
    return result !== 0;
  }

  public async getPendingInvitesForUser(session: User): Promise<GroupInvite[]> {
    return groupInvitesRepository.getPendingInvitesForUser(session.email);
  }

  public async getPendingInvitesForGroup(groupId: string, session: User): Promise<string[]> {
    const group = await groupsRepository.checkGroupExistence(groupId, session.id);
    if (!group) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Group not found or you are not the owner of the group",
      });
    }
    return groupInvitesRepository.getPendingInvitesForGroup(groupId);
  }
}

export const groupInvitesService = new GroupInvitesService();

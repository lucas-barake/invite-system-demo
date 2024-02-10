import { Logger } from "@/server/api/common/logger";
import { groupsRepository } from "@/server/api/routers/groups/repository/groups.repository";
import { TRPCError } from "@trpc/server";
import { DateTime } from "luxon";
import { groupInvitesRepository } from "@/server/api/routers/groups/sub-routers/group-invites/repository/group-invites.repository";
import { type Session } from "@/server/api/routers/auth/service/auth.service.types";
import { type GroupInvite } from "@/server/api/routers/groups/sub-routers/group-invites/repository/group-invites.repository.types";
import {
  type AcceptGroupInviteArgs,
  type DeclineGroupInviteArgs,
  type GetPendingInvitesForGroupArgs,
  type RemovePendingInviteArgs,
  type SendGroupInviteArgs,
} from "@/server/api/routers/groups/sub-routers/group-invites/service/group-invites.service.types";

class GroupInvitesService {
  private readonly _logger = new Logger(GroupInvitesService.name);

  public async sendGroupInvite(args: SendGroupInviteArgs): Promise<true> {
    if (args.input.email === args.session.user.email) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You cannot invite yourself",
      });
    }

    const group = await groupsRepository.checkGroupExistence({
      groupId: args.input.groupId,
      ownerId: args.session.user.id,
    });
    if (!group) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Group not found or you are not the owner of the group",
      });
    }

    const memberExists = await groupsRepository.checkGroupMemberExistence({
      groupId: args.input.groupId,
      userEmail: args.input.email,
    });
    if (memberExists) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User is already a member of this group",
      });
    }

    const expirationTime = DateTime.now().plus({ days: 7 }).toUTC().toJSDate();
    await groupInvitesRepository.addPendingInvite({
      groupId: args.input.groupId,
      inviteeEmail: args.input.email,
      expirationTime,
    });

    return true;
  }

  public async acceptGroupInvite(args: AcceptGroupInviteArgs): Promise<true> {
    const pendingInviteExists = await groupInvitesRepository.checkPendingInviteExistence({
      groupId: args.input.groupId,
      inviteeEmail: args.session.user.email,
    });
    if (!pendingInviteExists) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invite not found",
      });
    }

    const memberExists = await groupsRepository.checkGroupMemberExistence({
      groupId: args.input.groupId,
      userEmail: args.session.user.email,
    });
    if (memberExists) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You are already a member of this group",
      });
    }

    await groupInvitesRepository.addMemberToGroupAndRemovePendingInvite({
      groupId: args.input.groupId,
      userIdToAdd: args.session.user.id,
      inviteeEmail: args.session.user.email,
    });

    return true;
  }

  public async declineGroupInvite(args: DeclineGroupInviteArgs): Promise<boolean> {
    return groupInvitesRepository.deletePendingInvite({
      groupId: args.groupId,
      inviteeEmail: args.session.user.email,
    });
  }

  public async removePendingInvite(args: RemovePendingInviteArgs): Promise<boolean> {
    const groupExists = await groupsRepository.checkGroupExistence({
      groupId: args.groupId,
      ownerId: args.session.user.id,
    });
    if (!groupExists) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Group not found or you are not the owner of the group",
      });
    }
    return groupInvitesRepository.deletePendingInvite({
      groupId: args.groupId,
      inviteeEmail: args.inviteeEmail,
    });
  }

  public async getPendingInvitesForUser(session: Session): Promise<GroupInvite[]> {
    return groupInvitesRepository.getPendingInvitesForUser(session.user.email);
  }

  public async getPendingInvitesForGroup(args: GetPendingInvitesForGroupArgs): Promise<string[]> {
    const group = await groupsRepository.checkGroupExistence({
      groupId: args.groupId,
      ownerId: args.session.user.id,
    });
    if (!group) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Group not found or you are not the owner of the group",
      });
    }
    return groupInvitesRepository.getPendingInvitesForGroup(args.groupId);
  }
}

export const groupInvitesService = new GroupInvitesService();

import { type User } from "@/server/api/repositories/user-repository";
import {
  type AcceptGroupInviteInputType,
  type CreateGroupInputType,
  type SendGroupInviteInputType,
} from "@/server/api/routers/groups/groups.input";
import { groupsRepository } from "@/server/api/routers/groups/groups.repository";
import { type Group, type GroupInvite } from "@/server/api/routers/groups/groups.types";
import { TRPCError } from "@trpc/server";
import { DateTime } from "luxon";

class GroupsService {
  public async createGroup(input: CreateGroupInputType & { ownerId: string }): Promise<Group> {
    return groupsRepository.createGroup(input);
  }

  public async deleteGroup(groupId: string, ownerId: string): Promise<true> {
    const deleted = await groupsRepository.deleteGroup(groupId, ownerId);
    if (!deleted) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Group not found or you are not the owner of the group",
      });
    }
    return true;
  }

  public async getUserGroups(userId: string): Promise<Group[]> {
    return groupsRepository.getGroupsByUserId(userId);
  }

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

    const expirationTime = DateTime.now().plus({ days: 7 }).toJSDate();
    await groupsRepository.addPendingInvite({
      groupId: input.groupId,
      inviteeEmail: input.email,
      expirationTime,
    });
    return true;
  }

  public async acceptGroupInvite(input: AcceptGroupInviteInputType, session: User): Promise<true> {
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

    const pendingInviteExists = await groupsRepository.checkPendingInviteExistence(
      input.groupId,
      session.email
    );
    if (!pendingInviteExists) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invite not found",
      });
    }

    await groupsRepository.addMemberToGroup({
      groupId: input.groupId,
      userIdToAdd: session.id,
    });
    await groupsRepository.deletePendingInvite(input.groupId, session.email);

    return true;
  }

  public async declineGroupInvite(groupId: string, session: User): Promise<boolean> {
    const result = await groupsRepository.deletePendingInvite(groupId, session.email);
    return result !== 0;
  }

  public async getPendingInvitesForUser(session: User): Promise<GroupInvite[]> {
    return groupsRepository.getPendingInvitesForUser(session.email);
  }
}

export const groupsService = new GroupsService();

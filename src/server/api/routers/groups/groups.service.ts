import {
  type AcceptGroupInviteInputType,
  type SendGroupInviteInputType,
  type CreateGroupInputType,
} from "@/server/api/routers/groups/groups.input";
import { groupsRepository } from "@/server/api/routers/groups/groups.repository";
import { type Group } from "@/server/api/routers/groups/groups.types";
import { TRPCError } from "@trpc/server";

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

  public async sendGroupInvite(
    input: SendGroupInviteInputType & { ownerId: string }
  ): Promise<Group> {
    // TODO: Implement
  }

  public async acceptGroupInvite(
    input: AcceptGroupInviteInputType & { userId: string }
  ): Promise<Group> {
    // TODO: Implement
  }
}

export const groupsService = new GroupsService();

import { type CreateGroupInputType } from "@/server/api/routers/groups/groups.input";
import { groupsRepository } from "@/server/api/routers/groups/groups.repository";
import {
  type CreateGroupMutationResult,
  type GetAllGroupsQueryResult,
} from "@/server/api/routers/groups/groups.types";
import { TRPCError } from "@trpc/server";
import { type Session } from "@/server/api/routers/auth/auth.types";

class GroupsService {
  public async createGroup(
    input: CreateGroupInputType,
    session: Session
  ): Promise<CreateGroupMutationResult> {
    return groupsRepository.createGroup({ ...input, ownerId: session.user.id });
  }

  public async deleteGroup(groupId: string, session: Session): Promise<true> {
    const deleted = await groupsRepository.deleteGroup(groupId, session.user.id);
    if (!deleted) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Group not found or you are not the owner of the group",
      });
    }
    return true;
  }

  public async undoDeleteGroup(groupId: string, session: Session): Promise<true> {
    const restored = await groupsRepository.undoDeleteGroup(groupId, session.user.id);
    if (!restored) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Group not found or you are not the owner of the group",
      });
    }
    return true;
  }

  public async getUserGroups(session: Session): Promise<GetAllGroupsQueryResult> {
    return groupsRepository.getGroupsByUserId(session.user.id);
  }
}

export const groupsService = new GroupsService();

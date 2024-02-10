import { groupsRepository } from "@/server/api/routers/groups/repository/groups.repository";
import { TRPCError } from "@trpc/server";
import {
  type CreateGroupMutationResult,
  type GetAllGroupsQueryResult,
} from "@/server/api/routers/groups/groups.types";
import { type Session } from "@/server/api/routers/auth/service/auth.service.types";
import {
  type CreateGroupArgs,
  type DeleteGroupArgs,
  type UndoDeleteGroupArgs,
} from "@/server/api/routers/groups/service/groups.service.types";

class GroupsService {
  public async createGroup(args: CreateGroupArgs): Promise<CreateGroupMutationResult> {
    return groupsRepository.createGroup({
      input: args.input,
      ownerId: args.session.user.id,
    });
  }

  public async deleteGroup(args: DeleteGroupArgs): Promise<true> {
    const deleted = await groupsRepository.deleteGroup({
      groupId: args.groupId,
      ownerId: args.session.user.id,
    });
    if (!deleted) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Group not found or you are not the owner of the group",
      });
    }
    return true;
  }

  public async undoDeleteGroup(args: UndoDeleteGroupArgs): Promise<true> {
    const restored = await groupsRepository.undoDeleteGroup({
      groupId: args.groupId,
      ownerId: args.session.user.id,
    });
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

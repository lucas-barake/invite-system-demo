import {
  AcceptGroupInviteInput,
  SendGroupInviteInput,
  CreateGroupInput,
} from "@/server/api/routers/groups/groups.input";
import { groupsService } from "@/server/api/routers/groups/groups.service";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const groupsRouter = createTRPCRouter({
  createGroup: protectedProcedure.input(CreateGroupInput).mutation(({ input, ctx }) => {
    return groupsService.createGroup({ ...input, ownerId: ctx.session.id });
  }),

  deleteGroup: protectedProcedure.input(z.string().uuid()).mutation(({ input, ctx }) => {
    return groupsService.deleteGroup(input, ctx.session.id);
  }),

  getAllGroups: protectedProcedure.query(({ ctx }) => {
    return groupsService.getUserGroups(ctx.session.id);
  }),

  sendGroupInvite: protectedProcedure.input(SendGroupInviteInput).mutation(({ input, ctx }) => {
    return groupsService.sendGroupInvite(input, ctx.session);
  }),

  acceptGroupInvite: protectedProcedure.input(AcceptGroupInviteInput).mutation(({ input, ctx }) => {
    return groupsService.acceptGroupInvite(input, ctx.session);
  }),

  declineGroupInvite: protectedProcedure
    .input(
      z.object({
        groupId: z.string().uuid(),
      })
    )
    .mutation(({ input, ctx }) => {
      return groupsService.declineGroupInvite(input.groupId, ctx.session);
    }),

  getPendingInvitesForUser: protectedProcedure.query(({ ctx }) => {
    return groupsService.getPendingInvitesForUser(ctx.session);
  }),
});

import {
  AcceptGroupInviteInput,
  SendGroupInviteInput,
  CreateGroupInput,
} from "@/server/api/routers/groups/groups.input";
import { groupsService } from "@/server/api/routers/groups/groups.service";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const groupsRouter = createTRPCRouter({
  create: protectedProcedure.input(CreateGroupInput).mutation(({ input, ctx }) => {
    return groupsService.createGroup({ ...input, ownerId: ctx.session.id });
  }),

  delete: protectedProcedure.input(z.string().uuid()).mutation(({ input, ctx }) => {
    return groupsService.deleteGroup(input, ctx.session.id);
  }),

  getAll: protectedProcedure.query(({ ctx }) => {
    return groupsService.getUserGroups(ctx.session.id);
  }),

  sendGroupInvite: protectedProcedure.input(SendGroupInviteInput).mutation(({ input, ctx }) => {
    return groupsService.sendGroupInvite({ ...input, ownerId: ctx.session.id });
  }),

  acceptGroupInvite: protectedProcedure.input(AcceptGroupInviteInput).mutation(({ input, ctx }) => {
    return groupsService.acceptGroupInvite({ ...input, userId: ctx.session.id });
  }),
});

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { groupInvitesService } from "@/server/api/routers/groups/group-invites/group-invites.service";
import {
  AcceptGroupInviteInput,
  SendGroupInviteInput,
} from "@/server/api/routers/groups/group-invites/group-invites.input";

export const groupInvitesRouter = createTRPCRouter({
  sendGroupInvite: protectedProcedure.input(SendGroupInviteInput).mutation(({ input, ctx }) => {
    return groupInvitesService.sendGroupInvite(input, ctx.session);
  }),

  acceptGroupInvite: protectedProcedure.input(AcceptGroupInviteInput).mutation(({ input, ctx }) => {
    return groupInvitesService.acceptGroupInvite(input, ctx.session);
  }),

  declineGroupInvite: protectedProcedure
    .input(
      z.object({
        groupId: z.string().uuid(),
      })
    )
    .mutation(({ input, ctx }) => {
      return groupInvitesService.declineGroupInvite(input.groupId, ctx.session);
    }),

  getPendingInvitesForUser: protectedProcedure.query(({ ctx }) => {
    return groupInvitesService.getPendingInvitesForUser(ctx.session);
  }),
});

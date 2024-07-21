import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { groupInvitesService } from "@/server/api/routers/groups/sub-routers/group-invites/service/group-invites.service";
import {
  AcceptGroupInviteInput,
  SendGroupInviteInput,
} from "@/server/api/routers/groups/sub-routers/group-invites/group-invites.input";
import { type GetPendingInvitesForUserResult } from "@/server/api/routers/groups/sub-routers/group-invites/group-invites.types";
import { Effect, pipe } from "effect";
import { ServerRuntime, GroupInvitesService, SessionContext } from "@/server/api/layers";

export const groupInvitesRouter = createTRPCRouter({
  sendGroupInvite: protectedProcedure.input(SendGroupInviteInput).mutation(({ input, ctx }) => {
    return groupInvitesService.sendGroupInvite({
      input,
      session: ctx.session,
    });
  }),

  acceptGroupInvite: protectedProcedure.input(AcceptGroupInviteInput).mutation(({ input, ctx }) => {
    return pipe(
      Effect.flatMap(GroupInvitesService, (service) => service.acceptGroupInvite(input)),
      Effect.provideService(SessionContext, ctx.session),
      ServerRuntime.runPromise
    );
  }),

  declineGroupInvite: protectedProcedure
    .input(
      z.object({
        groupId: z.string().uuid(),
      })
    )
    .mutation(({ input, ctx }) => {
      return groupInvitesService.declineGroupInvite({
        groupId: input.groupId,
        session: ctx.session,
      });
    }),

  removePendingInvite: protectedProcedure
    .input(
      z.object({
        groupId: z.string().uuid(),
        inviteeEmail: z.string().email(),
      })
    )
    .mutation(({ input, ctx }) => {
      return groupInvitesService.removePendingInvite({
        groupId: input.groupId,
        inviteeEmail: input.inviteeEmail,
        session: ctx.session,
      });
    }),

  getPendingInvitesForUser: protectedProcedure.query(
    ({ ctx }): Promise<GetPendingInvitesForUserResult> => {
      return groupInvitesService.getPendingInvitesForUser(ctx.session);
    }
  ),

  getPendingInvitesForGroup: protectedProcedure
    .input(
      z.object({
        groupId: z.string().uuid(),
      })
    )
    .query(({ input, ctx }) => {
      return groupInvitesService.getPendingInvitesForGroup({
        groupId: input.groupId,
        session: ctx.session,
      });
    }),
});

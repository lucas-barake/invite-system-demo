import { CreateGroupInput } from "@/server/api/routers/groups/groups.input";
import { groupsService } from "@/server/api/routers/groups/service/groups.service";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import {
  type CreateGroupMutationResult,
  type GetAllGroupsQueryResult,
} from "@/server/api/routers/groups/groups.types";
import { groupInvitesRouter } from "@/server/api/routers/groups/sub-routers/group-invites/group-invites.router";
import { rateLimitMiddleware } from "@/server/api/common/middlewares/rate-limit.middleware";

export const groupsRouter = createTRPCRouter({
  createGroup: protectedProcedure
    .use(async (opts) => {
      await rateLimitMiddleware(opts.ctx.session, {
        maxRequests: 5,
        per: [1, "minutes"],
        uniqueId: "createGroup",
      });
      return opts.next();
    })
    .input(CreateGroupInput)
    .mutation(({ input, ctx }): Promise<CreateGroupMutationResult> => {
      return groupsService.createGroup({
        input,
        session: ctx.session,
      });
    }),

  deleteGroup: protectedProcedure.input(z.string().uuid()).mutation(({ input, ctx }) => {
    return groupsService.deleteGroup({
      groupId: input,
      session: ctx.session,
    });
  }),

  undoDeleteGroup: protectedProcedure.input(z.string().uuid()).mutation(({ input, ctx }) => {
    return groupsService.undoDeleteGroup({
      groupId: input,
      session: ctx.session,
    });
  }),

  getAllGroups: protectedProcedure.query(async ({ ctx }): Promise<GetAllGroupsQueryResult> => {
    return groupsService.getUserGroups(ctx.session);
  }),

  invites: groupInvitesRouter,
});

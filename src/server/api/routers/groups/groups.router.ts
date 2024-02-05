import { CreateGroupInput } from "@/server/api/routers/groups/groups.input";
import { groupsService } from "@/server/api/routers/groups/groups.service";
import {
  createTRPCRouter,
  protectedProcedure,
  protectedRateLimitedProcedure,
} from "@/server/api/trpc";
import { z } from "zod";

export const groupsRouter = createTRPCRouter({
  createGroup: protectedRateLimitedProcedure({
    enabled: true,
    maxRequests: 2,
    per: [1, "minutes"],
    uniqueId: "create-group",
  })
    .input(CreateGroupInput)
    .mutation(({ input, ctx }) => {
      return groupsService.createGroup(input, ctx.session);
    }),

  deleteGroup: protectedProcedure.input(z.string().uuid()).mutation(({ input, ctx }) => {
    return groupsService.deleteGroup(input, ctx.session);
  }),

  undoDeleteGroup: protectedProcedure.input(z.string().uuid()).mutation(({ input, ctx }) => {
    return groupsService.undoDeleteGroup(input, ctx.session);
  }),

  getAllGroups: protectedProcedure.query(async ({ ctx }) => {
    return groupsService.getUserGroups(ctx.session);
  }),
});

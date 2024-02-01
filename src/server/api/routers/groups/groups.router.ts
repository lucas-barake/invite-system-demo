import { CreateGroupInput } from "@/server/api/routers/groups/groups.input";
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
});

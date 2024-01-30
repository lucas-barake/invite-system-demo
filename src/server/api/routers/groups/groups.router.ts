import { CreateGroupInput } from "@/server/api/routers/groups/groups.input";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const groupsRouter = createTRPCRouter({
  create: protectedProcedure.input(CreateGroupInput).mutation(async ({ input, ctx }) => {}),
});

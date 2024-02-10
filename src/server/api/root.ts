import { createTRPCRouter } from "@/server/api/trpc";
import { authRouter } from "@/server/api/routers/auth/auth.router";
import { groupsRouter } from "@/server/api/routers/groups/groups.router";
import { groupInvitesRouter } from "@/server/api/routers/groups/sub-routers/group-invites/group-invites.router";
import { userRouter } from "@/server/api/routers/user/user.router";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  groups: groupsRouter,
  groupInvites: groupInvitesRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

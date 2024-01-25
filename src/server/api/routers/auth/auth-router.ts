import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { authService } from "@/server/api/routers/auth/auth-service";
import { TRPCError } from "@trpc/server";
import { type User } from "@/server/api/repositories/user-repository";

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(
      z.object({
        accessToken: z.string(),
      })
    )
    .mutation(async ({ input, ctx }): Promise<User> => {
      return authService.login(input.accessToken, ctx.headers);
    }),

  me: protectedProcedure.query(async ({ ctx }): Promise<User> => {
    return {
      email: ctx.session.email,
      id: ctx.session.id,
      imageUrl: ctx.session.imageUrl,
      name: ctx.session.name,
    };
  }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await authService.logout({
        sessionToken: ctx.session.sessionToken,
        userId: ctx.session.id,
        headers: ctx.headers,
      });
    } catch (error: unknown) {
      // TODO: Logging
      console.log("Failed to logout", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to logout",
      });
    }
  }),
});

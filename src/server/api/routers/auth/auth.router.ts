import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { authService } from "@/server/api/routers/auth/auth.service";
import { TRPCError } from "@trpc/server";
import { Logger } from "@/server/api/common/logger";
import { type MeQueryResult } from "@/server/api/routers/auth/auth.types";

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(
      z.object({
        accessToken: z.string(),
      })
    )
    .mutation(async ({ input, ctx }): Promise<MeQueryResult> => {
      return authService.login(input.accessToken, ctx.headers);
    }),

  me: protectedProcedure.query(async ({ ctx }): Promise<MeQueryResult> => {
    return {
      user: ctx.session.user,
    };
  }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await authService.logout({
        session: ctx.session,
        headers: ctx.headers,
      });
    } catch (error: unknown) {
      Logger.error("Failed to logout", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to logout",
      });
    }
  }),
});

import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { authService } from "@/server/api/routers/auth/auth-service";
import { env } from "@/env";
import { TRPCError } from "@trpc/server";

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(
      z.object({
        accessToken: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { sessionToken, userInfo, expiresIn } = await authService.login(input.accessToken);

      const secure = env.NODE_ENV === "production" ? "Secure;" : "";
      const expires = `Expires=${new Date(Date.now() + expiresIn).toUTCString()};`;
      ctx.headers.set(
        "Set-Cookie",
        `session_token=${sessionToken}; HttpOnly; Path=/; SameSite=Lax; ${secure} ${expires}`
      );

      return userInfo;
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const userInfo = await authService.getUserInfo(ctx.session.id);

    if (userInfo === null) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get user info",
      });
    }

    return userInfo;
  }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await authService.logout(ctx.session.sessionToken);
      ctx.headers.set(
        "Set-Cookie",
        `session_token=; HttpOnly; Path=/; SameSite=Lax; Expires=${new Date(0).toUTCString()}`
      );
    } catch (error: unknown) {
      console.log("Failed to logout", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to logout",
      });
    }
  }),
});

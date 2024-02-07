/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { type NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  authService,
  SESSION_TOKEN_COOKIE_KEY,
  USER_ID_COOKIE_KEY,
} from "@/server/api/routers/auth/auth.service";
import { type Session } from "@/server/api/routers/auth/auth.types";
import { rateLimit, type RateLimitConfig } from "@/server/api/common/middlewares/rate-limit";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers; req: NextRequest }) => {
  return {
    ...opts,
  };
};
export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure;

type ProtectedProcedureOpts = TRPCContext & {
  session: Session;
};
const enforceUserIsAuthenticated = t.middleware(async (opts) => {
  const encodedSessionToken = cookies().get(SESSION_TOKEN_COOKIE_KEY)?.value;
  const userId = cookies().get(USER_ID_COOKIE_KEY)?.value;
  if (encodedSessionToken === undefined || userId === undefined) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action",
    });
  }

  try {
    const result = await authService.validateSessionToken({
      encodedSessionToken,
      userId,
    });

    if (!result.success) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to perform this action",
      });
    }

    if (result.userInfo === null) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve user info",
      });
    }

    return await opts.next({
      ctx: {
        ...opts.ctx,
        session: {
          user: result.userInfo,
          sessionToken: result.sessionToken,
        },
      } satisfies ProtectedProcedureOpts,
    });
  } catch (error: unknown) {
    if (error instanceof TRPCError) {
      throw error;
    }
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to verify session token",
    });
  }
});
export const protectedProcedure = t.procedure.use(enforceUserIsAuthenticated);
export const protectedRateLimitedProcedure = (
  configOrFn:
    | RateLimitConfig
    | ((opts: ProtectedProcedureOpts) => RateLimitConfig)
    | ((opts: ProtectedProcedureOpts) => Promise<RateLimitConfig>)
) => {
  return protectedProcedure.use(async (opts) => {
    let config: RateLimitConfig;

    if (typeof configOrFn === "function") {
      const result = configOrFn({ ...opts.ctx, session: opts.ctx.session });

      if (result instanceof Promise) {
        config = await result;
      } else {
        config = result;
      }
    } else {
      config = configOrFn;
    }

    await rateLimit(opts.ctx.session, config);
    return opts.next(opts);
  });
};

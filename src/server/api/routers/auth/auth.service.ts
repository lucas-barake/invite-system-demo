import { admin } from "@/server/firebase-admin";
import { TRPCError } from "@trpc/server";
import { type User, userRepository } from "@/server/api/common/repositories/user.repository";
import { redis } from "@/server/redis";
import argon2 from "argon2";
import { createSecureCookie, deleteCookie } from "@/server/api/common/utils/cookie-management";
import { type MeQueryResult, type Session } from "@/server/api/routers/auth/auth.types";

export const SESSION_TOKEN_COOKIE_KEY = "x-session-token";
export const USER_ID_COOKIE_KEY = "x-user-id";

export const SESSION_TOKENS_PREFIX = "session-tokens:";
export function getSessionTokensKey(userId: string): string {
  return `${SESSION_TOKENS_PREFIX}${userId}`;
}

class AuthService {
  public getSessionTokensKey(userId: string): string {
    return `${SESSION_TOKENS_PREFIX}${userId}`;
  }

  private async addUserSession(
    userId: User["id"],
    sessionToken: string,
    expiresIn: number
  ): Promise<void> {
    const sessionKey = this.getSessionTokensKey(userId);
    const score = Math.floor(Date.now() / 1000) + expiresIn; // Current time + expiration time in seconds

    const pipeline = redis.multi();
    pipeline.zadd(sessionKey, score.toString(), sessionToken);
    pipeline.zcount(sessionKey, "-inf", "+inf");
    pipeline.expire(sessionKey, expiresIn);

    const results = await pipeline.exec();
    const sessionTokensCount = results?.[1]?.[1];
    if (
      !Array.isArray(results) ||
      results.some((result) => result[0] !== null) ||
      typeof sessionTokensCount !== "number"
    ) {
      // TODO: Logging
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to add user session",
      });
    }

    const SESSIONS_TOKEN_LIMIT = 8;
    if (sessionTokensCount > SESSIONS_TOKEN_LIMIT) {
      const tokensToRemove = sessionTokensCount - 8;
      pipeline.zremrangebyrank(sessionKey, 0, tokensToRemove - 1);
    }

    await pipeline.exec();
  }

  private async deleteSessionToken(args: {
    userId: User["id"];
    sessionToken: string;
  }): Promise<void> {
    const sessionKey = this.getSessionTokensKey(args.userId);
    await redis.zrem(sessionKey, args.sessionToken);
  }

  private async checkSessionTokenValidity(
    userId: User["id"],
    sessionToken: string
  ): Promise<boolean> {
    const sessionKey = this.getSessionTokensKey(userId);
    const score = await redis.zscore(sessionKey, sessionToken);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (score !== null && parseInt(score, 10) > currentTimestamp) {
      return true;
    }

    await redis.zrem(sessionKey, sessionToken);
    return false;
  }

  private async generateSessionToken(userId: Session["user"]["id"]): Promise<string> {
    const rawToken = `${userId}-${Date.now()}-${Math.random()}`;
    const hashedToken = await argon2.hash(rawToken);
    return hashedToken;
  }

  public async login(accessToken: string, headers: Headers): Promise<MeQueryResult> {
    try {
      const verifiedToken = await admin.auth().verifyIdToken(accessToken);
      if (verifiedToken.email === undefined) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "The access token is invalid",
        });
      }

      const name = typeof verifiedToken.name === "string" ? verifiedToken.name : null;
      const userInfo = await userRepository.upsertUser({
        onCreate: {
          email: verifiedToken.email,
          imageUrl: verifiedToken.picture ?? null,
          name,
        },
        onUpdate: {
          imageUrl: verifiedToken.picture ?? null,
          name,
        },
      });
      if (userInfo === null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to login",
        });
      }

      const expiresIn = 60 * 60 * 24 * 5; // 5 days in seconds
      const sessionToken = await this.generateSessionToken(userInfo.id);
      await this.addUserSession(userInfo.id, sessionToken, expiresIn);

      createSecureCookie({
        headers,
        expiresInSeconds: expiresIn,
        name: SESSION_TOKEN_COOKIE_KEY,
        value: encodeURIComponent(sessionToken),
      });

      createSecureCookie({
        headers,
        expiresInSeconds: expiresIn,
        name: USER_ID_COOKIE_KEY,
        value: userInfo.id,
      });

      return {
        user: userInfo,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: error.message,
        });
      }
      if (error instanceof TRPCError) throw error;
      // TODO: Logging
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to login",
      });
    }
  }

  public async logout(args: { session: Session; headers: Headers }): Promise<void> {
    await this.deleteSessionToken({
      userId: args.session.user.id,
      sessionToken: args.session.sessionToken,
    });

    deleteCookie({
      headers: args.headers,
      name: SESSION_TOKEN_COOKIE_KEY,
    });

    deleteCookie({
      headers: args.headers,
      name: USER_ID_COOKIE_KEY,
    });
  }

  public async validateSessionToken(args: {
    encodedSessionToken: string;
    userId: User["id"];
  }): Promise<
    | {
        success: true;
        userInfo: Session["user"] | null;
        sessionToken: string;
      }
    | {
        success: false;
      }
  > {
    const decodedSessionToken = decodeURIComponent(args.encodedSessionToken);
    const isSessionTokenValid = await this.checkSessionTokenValidity(
      args.userId,
      decodedSessionToken
    );

    if (!isSessionTokenValid) {
      return {
        success: false,
      };
    }

    return {
      success: true,
      userInfo: await userRepository.getUserById(args.userId, {
        includeSensitiveInfo: true,
      }),
      sessionToken: decodedSessionToken,
    };
  }
}

export const authService = new AuthService();

import { admin } from "@/server/firebase-admin";
import { TRPCError } from "@trpc/server";
import { type User, userRepository } from "@/server/api/repositories/user-repository";
import { redis } from "@/server/redis";
import argon2 from "argon2";
import { env } from "@/env";

export const SESSION_TOKEN_COOKIE_KEY = "x-session-token";
export const USER_ID_COOKIE_KEY = "x-user-id";

export const SESSION_TOKENS_PREFIX = "session-tokens:";
export function getSessionTokensKey(userId: string): string {
  return `${SESSION_TOKENS_PREFIX}${userId}`;
}

async function addUserSession(
  userId: User["id"],
  sessionToken: string,
  expiresIn: number
): Promise<void> {
  const sessionKey = getSessionTokensKey(userId);
  const score = Math.floor(Date.now() / 1000) + expiresIn; // Current time + expiration time in seconds
  await redis.zadd(sessionKey, score.toString(), sessionToken);
  await redis.expire(sessionKey, expiresIn);
}

async function deleteSessionToken(args: {
  userId: User["id"];
  sessionToken: string;
}): Promise<void> {
  const sessionKey = getSessionTokensKey(args.userId);
  await redis.zrem(sessionKey, args.sessionToken);
}

async function getSessionToken(userId: User["id"], sessionToken: string): Promise<boolean> {
  const sessionKey = getSessionTokensKey(userId);
  const score = await redis.zscore(sessionKey, sessionToken);
  const currentTimestamp = Math.floor(Date.now() / 1000);
  if (score !== null && parseInt(score, 10) > currentTimestamp) {
    // Token is valid and not expired
    return true;
  }

  // Token is either not found or expired, remove it if it exists
  await redis.zrem(sessionKey, sessionToken);
  return false;
}

async function generateSessionToken(userId: string): Promise<string> {
  const rawToken = `${userId}-${Date.now()}-${Math.random()}`;
  const hashedToken = await argon2.hash(rawToken);
  return hashedToken;
}

export const authService = {
  createSecureCookie(args: {
    headers: Headers;
    expiresIn: number;
    name: string;
    value: string;
  }): void {
    const secure = env.NODE_ENV === "production" ? "Secure;" : "";
    const cookie = `${args.name}=${args.value}; HttpOnly; Path=/; SameSite=Lax; ${secure} Expires=${new Date(
      Date.now() + args.expiresIn
    ).toUTCString()}`;
    args.headers.append("Set-Cookie", cookie);
  },

  deleteCookie(args: { headers: Headers; name: string }): void {
    const secure = env.NODE_ENV === "production" ? "Secure;" : "";
    const cookie = `${args.name}=; HttpOnly; Path=/; SameSite=Lax; ${secure} Expires=${new Date(0).toUTCString()}`;
    args.headers.append("Set-Cookie", cookie);
  },

  async login(accessToken: string, headers: Headers): Promise<User> {
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
      const sessionToken = await generateSessionToken(userInfo.id);
      await addUserSession(userInfo.id, sessionToken, expiresIn);

      this.createSecureCookie({
        headers,
        expiresIn,
        name: SESSION_TOKEN_COOKIE_KEY,
        value: encodeURIComponent(sessionToken),
      });

      this.createSecureCookie({
        headers,
        expiresIn,
        name: USER_ID_COOKIE_KEY,
        value: userInfo.id,
      });

      return userInfo;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: error.message,
        });
      }
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to login",
      });
    }
  },

  async getUserInfo(id: User["id"]): Promise<User | null> {
    return userRepository.getUserById(id);
  },

  async logout(args: {
    userId: User["id"];
    sessionToken: string;
    headers: Headers;
  }): Promise<void> {
    await deleteSessionToken({
      userId: args.userId,
      sessionToken: args.sessionToken,
    });

    this.deleteCookie({
      headers: args.headers,
      name: SESSION_TOKEN_COOKIE_KEY,
    });

    this.deleteCookie({
      headers: args.headers,
      name: USER_ID_COOKIE_KEY,
    });
  },

  async validateSessionToken(args: { encodedSessionToken: string; userId: User["id"] }): Promise<
    | {
        success: true;
        userInfo: User | null;
        sessionToken: string;
      }
    | {
        success: false;
      }
  > {
    const decodedSessionToken = decodeURIComponent(args.encodedSessionToken);
    const exists = await getSessionToken(args.userId, decodedSessionToken);

    if (!exists) {
      return {
        success: false,
      };
    }

    return {
      success: true,
      userInfo: await this.getUserInfo(args.userId),
      sessionToken: decodedSessionToken,
    };
  },
};

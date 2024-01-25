import { admin } from "@/server/firebase-admin";
import { TRPCError } from "@trpc/server";
import { type User, userRepository } from "@/server/api/repositories/user-repository";
import { redis } from "@/server/redis";
import argon2 from "argon2";

async function generateSessionToken(userId: string): Promise<string> {
  const rawToken = `${userId}-${Date.now()}-${Math.random()}`;
  const hashedToken = await argon2.hash(rawToken);
  return hashedToken;
}

function stringifyUser(user: User): string {
  return JSON.stringify(user);
}

function parseUser(userString: string): User {
  return JSON.parse(userString) as User;
}

async function verifySessionToken(sessionToken: string): Promise<User | null> {
  const userString = await redis.get(sessionToken);
  if (userString === null) return null;
  return parseUser(userString);
}

export const authService = {
  async login(accessToken: string): Promise<{
    sessionToken: string;
    userInfo: User;
    expiresIn: number;
  }> {
    try {
      const verifiedToken = await admin.auth().verifyIdToken(accessToken);
      if (verifiedToken.email === undefined) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "The access token is invalid",
        });
      }

      const name = typeof verifiedToken.name === "string" ? verifiedToken.name : null;
      const userInfo = await userRepository.upsertUser(verifiedToken.email, {
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
      await redis.set(sessionToken, stringifyUser(userInfo), "EX", expiresIn);

      return {
        sessionToken: encodeURIComponent(sessionToken),
        userInfo,
        expiresIn,
      };
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

  async logout(sessionToken: string): Promise<void> {
    await redis.del(sessionToken);
  },

  async validateSessionToken(sessionToken: string): Promise<User & { sessionToken: string }> {
    // Decode the session token from the cookies
    const decodedSessionToken = decodeURIComponent(sessionToken);
    console.log({ decodedSessionToken });
    // Use the decoded token to retrieve the session from Redis
    const user = await verifySessionToken(decodedSessionToken);
    if (user === null) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid session token",
      });
    }
    return {
      ...user,
      sessionToken: decodedSessionToken,
    };
  },
};

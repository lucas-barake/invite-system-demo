import { db } from "@/server/database";
import { redis } from "@/server/redis";
import { type Session } from "@/server/api/routers/auth/auth.types";
import { DateTime } from "luxon";
import { PostgresError } from "@/server/api/common/enums/postgres-error.enum";
import { DatabaseError } from "pg";
import { TRPCError } from "@trpc/server";
import { Logger } from "@/server/api/common/logger";

export type User = Pick<Session["user"], "id" | "name" | "email" | "imageUrl">;

class UserRepository {
  private readonly logger = new Logger(UserRepository.name);

  private getUserInfoKey(userId: string): string {
    return `user-info:${userId}`;
  }

  private async cacheUserInfo(userId: User["id"], user: User): Promise<void> {
    const userKey = this.getUserInfoKey(userId);
    await redis.set(
      userKey,
      JSON.stringify(user),
      "EX",
      60 * 60 * 24 * 7 // 7 days in seconds
    );
  }

  private async getCachedUserInfo(id: Session["user"]["id"]): Promise<Session["user"] | null> {
    const userKey = this.getUserInfoKey(id);
    const cachedUserInfo = await redis.get(userKey);
    return cachedUserInfo !== null ? (JSON.parse(cachedUserInfo) as Session["user"]) : null;
  }

  public async getUserById<T extends boolean = false>(
    id: User["id"],
    options?: { includeSensitiveInfo?: T; bypassCache?: boolean }
  ): Promise<(T extends true ? Session["user"] : User) | null> {
    const { includeSensitiveInfo = false, bypassCache = false } = options ?? {};

    if (!bypassCache) {
      const cachedUserInfo = await this.getCachedUserInfo(id);
      if (cachedUserInfo !== null) {
        if (includeSensitiveInfo) return cachedUserInfo;

        return {
          email: cachedUserInfo.email,
          imageUrl: cachedUserInfo.imageUrl,
          name: cachedUserInfo.name,
          id: cachedUserInfo.id,
        } satisfies User as T extends true ? Session["user"] : User;
      }
    }

    const userQuery = await db
      .selectFrom("users")
      .select(
        includeSensitiveInfo
          ? ["id", "name", "email", "imageUrl", "phoneNumber", "phoneVerified"]
          : ["id", "name", "email", "imageUrl"]
      )
      .where("id", "=", id)
      .executeTakeFirst();

    if (userQuery !== undefined) {
      void this.cacheUserInfo(userQuery.id, userQuery);
    }
    return userQuery ?? null;
  }

  public async upsertUser(data: {
    onCreate: Pick<User, "name" | "imageUrl" | "email">;
    onUpdate: Pick<User, "name" | "imageUrl">;
  }): Promise<Session["user"] | null> {
    const result = await db
      .insertInto("users")
      .values({
        name: data.onCreate.name,
        email: data.onCreate.email,
        imageUrl: data.onCreate.imageUrl,
        updated_at: new Date(),
      })
      .onConflict((oc) =>
        oc.column("email").doUpdateSet({
          name: data.onUpdate.name,
          imageUrl: data.onUpdate.imageUrl,
        })
      )
      .returning(["id", "name", "email", "imageUrl", "phoneNumber", "phoneVerified"])
      .executeTakeFirst();

    if (result !== undefined) {
      void this.cacheUserInfo(result.id, result);
    }

    return result ?? null;
  }

  public async updateUserPhoneNumber(
    userId: string,
    phoneNumber: string
  ): Promise<Session["user"]> {
    try {
      await db
        .updateTable("users")
        .set({
          phoneNumber,
          phoneVerified: DateTime.now().toUTC().toISO(),
        })
        .where("id", "=", userId)
        .execute();
    } catch (error) {
      if (error instanceof DatabaseError && error.code === PostgresError.UNIQUE_VIOLATION) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Phone number already in use",
        });
      }
      this.logger.error("Failed to update phone number", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update phone number",
      });
    }

    const updatedUser = await this.getUserById(userId, {
      includeSensitiveInfo: true,
      bypassCache: true,
    });
    if (updatedUser === null) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve updated user",
      });
    }

    await this.cacheUserInfo(userId, updatedUser);
    return updatedUser;
  }
}

export const userRepository = new UserRepository();

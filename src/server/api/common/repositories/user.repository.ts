import { db } from "@/server/database";
import { redis } from "@/server/redis";
import { type Session } from "@/server/api/routers/auth/auth.types";

const USER_INFO_PREFIX = "user-info:";

export function getUserInfoKey(userId: string): string {
  return `${USER_INFO_PREFIX}${userId}`;
}

export type User = Pick<Session["user"], "id" | "name" | "email" | "imageUrl">;

export const userRepository = {
  async cacheUserInfo(userId: User["id"], user: User): Promise<void> {
    const userKey = getUserInfoKey(userId);
    await redis.set(
      userKey,
      JSON.stringify(user),
      "EX",
      60 * 60 * 24 * 7 // 7 days in seconds
    );
  },

  async getCachedUserInfo(id: Session["user"]["id"]): Promise<Session["user"] | null> {
    const userKey = getUserInfoKey(id);
    const cachedUserInfo = await redis.get(userKey);
    return cachedUserInfo !== null ? (JSON.parse(cachedUserInfo) as Session["user"]) : null;
  },

  async getUserById<T extends boolean = false>(
    id: User["id"],
    includeSensitiveInfo?: T
  ): Promise<(T extends true ? Session["user"] : User) | null> {
    const cachedUserInfo = await this.getCachedUserInfo(id);
    if (cachedUserInfo !== null) {
      if (includeSensitiveInfo === true) {
        return cachedUserInfo;
      }
      return {
        email: cachedUserInfo.email,
        imageUrl: cachedUserInfo.imageUrl,
        name: cachedUserInfo.name,
        id: cachedUserInfo.id,
        // Make TypeScript happy
      } satisfies User as T extends true ? Session["user"] : User;
    }
    const userQuery = await db
      .selectFrom("users")
      .select(
        includeSensitiveInfo === true
          ? ["id", "name", "email", "imageUrl", "phoneNumber", "phoneVerified"]
          : ["id", "name", "email", "imageUrl"]
      )
      .where("id", "=", id)
      .executeTakeFirst();
    if (userQuery !== undefined) {
      void this.cacheUserInfo(userQuery.id, userQuery);
    }
    return userQuery ?? null;
  },

  async upsertUser(data: {
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
  },
};

import { type Users } from "kysely-codegen";
import { db } from "@/server/database";
import { type Selectable } from "kysely";
import { redis } from "@/server/redis";

const USER_INFO_PREFIX = "user-info:";

export function getUserInfoKey(userId: string): string {
  return `${USER_INFO_PREFIX}${userId}`;
}

export type User = {
  email: Users["email"];
  id: Selectable<Users>["id"];
  name: Users["name"];
  imageUrl: Users["imageUrl"];
};

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

  async getCachedUserInfo(id: User["id"]): Promise<User | null> {
    const userKey = getUserInfoKey(id);
    const cachedUserInfo = await redis.get(userKey);
    return cachedUserInfo !== null ? (JSON.parse(cachedUserInfo) as User) : null;
  },

  async getUserById(id: User["id"]): Promise<User | null> {
    const cachedUserInfo = await this.getCachedUserInfo(id);
    if (cachedUserInfo !== null) {
      return cachedUserInfo;
    }
    const userQuery = await db
      .selectFrom("users")
      .select(["id", "name", "email", "imageUrl"])
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
  }): Promise<User | null> {
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
      .returning(["id", "name", "email", "imageUrl"])
      .executeTakeFirst();

    if (result !== undefined) {
      void this.cacheUserInfo(result.id, result);
    }

    return result ?? null;
  },
};

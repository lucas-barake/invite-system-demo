import { type Users } from "kysely-codegen";
import { db } from "@/server/database";
import { type Selectable } from "kysely";

export type User = {
  email: Users["email"];
  id: Selectable<Users>["id"];
  name: Users["name"];
  imageUrl: Users["imageUrl"];
};

export const userRepository = {
  async getUserById(id: User["id"]): Promise<User | null> {
    const userQuery = await db
      .selectFrom("users")
      .select(["id", "name", "email", "imageUrl"])
      .where("id", "=", id)
      .executeTakeFirst();
    return userQuery ?? null;
  },

  async upsertUser(
    email: User["email"],
    data: {
      onCreate: Pick<User, "name" | "imageUrl" | "email">;
      onUpdate: Pick<User, "name" | "imageUrl">;
    }
  ): Promise<User | null> {
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

    return result ?? null;
  },
};

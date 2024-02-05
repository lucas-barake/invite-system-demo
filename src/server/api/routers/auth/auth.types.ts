import type { Users } from "kysely-codegen";
import type { Selectable } from "kysely";

export type Session = {
  user: {
    email: Users["email"];
    id: Selectable<Users>["id"];
    name: Users["name"];
    imageUrl: Users["imageUrl"];
  };
  sessionToken: string;
};

import type { Users } from "kysely-codegen";
import type { Selectable } from "kysely";

export type Session = {
  user: {
    email: Users["email"];
    id: Selectable<Users>["id"];
    name: Users["name"];
    imageUrl: Users["imageUrl"];
    phoneNumber: Users["phoneNumber"];
    phoneVerified: Selectable<Users>["phoneVerified"];
  };
  sessionToken: string;
};

export type MeQueryResult = {
  user: Session["user"];
};

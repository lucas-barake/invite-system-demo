import type { User } from "@/server/api/routers/user/repository/user.repository.types";
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

export type AddUserSessionArgs = {
  userId: User["id"];
  sessionToken: string;
  expiresIn: number;
};

export type DeleteSessionTokenArgs = {
  userId: User["id"];
  sessionToken: string;
};

export type LogoutArgs = {
  headers: Headers;
  session: Session;
};

export type ValidateSessionTokenArgs = {
  encodedSessionToken: string;
  userId: User["id"];
};
export type ValidateSessionTokenResult =
  | {
      success: true;
      userInfo: Session["user"] | null;
      sessionToken: string;
    }
  | {
      success: false;
    };

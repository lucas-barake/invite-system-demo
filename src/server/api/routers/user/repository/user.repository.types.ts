import { type Session } from "@/server/api/routers/auth/service/auth.service.types";

export type GetUserByIdOptions<T extends boolean> = {
  includeSensitiveInfo?: T;
  bypassCache?: boolean;
};

export type User = Pick<Session["user"], "id" | "name" | "email" | "imageUrl">;

export type UpsertUserParams = {
  onCreate: Pick<User, "name" | "imageUrl" | "email">;
  onUpdate: Pick<User, "name" | "imageUrl">;
};

export type UpdateUserPhoneNumParams = {
  userId: User["id"];
  phoneNumber: string;
};

import { type Session } from "@/server/api/routers/auth/service/auth.service.types";
import { type CreateGroupInputType } from "@/server/api/routers/groups/groups.input";

export type CreateGroupArgs = {
  input: CreateGroupInputType;
  session: Session;
};

export type DeleteGroupArgs = {
  groupId: string;
  session: Session;
};

export type UndoDeleteGroupArgs = {
  groupId: string;
  session: Session;
};

import type { Selectable } from "kysely";
import type { User } from "@/server/api/routers/user/repository/user.repository.types";
import type { GroupMembers, Groups } from "kysely-codegen";
import { type CreateGroupInputType } from "@/server/api/routers/groups/groups.input";

export type GroupMember = {
  email: Selectable<User>["email"];
  id: Selectable<User>["id"];
  name: Selectable<User>["name"];
  imageUrl: Selectable<User>["imageUrl"];
  updated_at: Selectable<GroupMembers>["updated_at"] | null;
};

export type Group = {
  created_at: Selectable<Groups>["created_at"] | null;
  id: Selectable<Groups>["id"];
  title: Selectable<Groups>["title"];
  updated_at: Selectable<Groups>["updated_at"] | null;
  members: GroupMember[];
  owner: Omit<GroupMember, "updated_at">;
};

export type CreateGroupArgs = {
  input: CreateGroupInputType;
  ownerId: User["id"];
};

export type DeleteGroupArgs = {
  groupId: Group["id"];
  ownerId: User["id"];
};

export type UndoDeleteGroupArgs = {
  groupId: Group["id"];
  ownerId: User["id"];
};

export type CheckGroupExistenceArgs = {
  groupId: Group["id"];
  ownerId: User["id"];
};

export type CheckGroupMemberExistenceArgs = {
  groupId: Group["id"];
  userEmail: User["email"];
};

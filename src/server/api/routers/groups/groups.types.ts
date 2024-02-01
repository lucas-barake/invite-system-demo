import { type User } from "@/server/api/common/repositories/user-repository";
import { type Selectable } from "kysely";
import { type GroupMembers, type Groups } from "kysely-codegen";

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

export type GroupInvite = {
  groupId: Selectable<Groups>["id"];
  title: Selectable<Groups>["title"];
  owner: Omit<GroupMember, "updated_at">;
};

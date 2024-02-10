import type { Selectable } from "kysely";
import type { Groups } from "kysely-codegen";
import type { GroupMember } from "@/server/api/routers/groups/repository/groups.repository.types";

export type GroupInvite = {
  groupId: Selectable<Groups>["id"];
  title: Selectable<Groups>["title"];
  owner: Omit<GroupMember, "updated_at">;
};

export type AddPendingInviteArgs = {
  groupId: string;
  inviteeEmail: string;
  expirationTime: Date;
};

export type DeletePendingInviteArgs = {
  groupId: string;
  inviteeEmail: string;
};

export type CheckPendingInviteExistenceArgs = {
  groupId: string;
  inviteeEmail: string;
};

export type AddMemberToGroupAndRemovePendingInviteArgs = {
  groupId: string;
  userIdToAdd: string;
  inviteeEmail: string;
};

import type { Selectable } from "kysely";
import type { Groups } from "kysely-codegen";
import { type GroupMember } from "@/server/api/routers/groups/groups.types";

export type GroupInvite = {
  groupId: Selectable<Groups>["id"];
  title: Selectable<Groups>["title"];
  owner: Omit<GroupMember, "updated_at">;
};

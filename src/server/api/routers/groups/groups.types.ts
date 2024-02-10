import type { Group } from "@/server/api/routers/groups/repository/groups.repository.types";

export type GetAllGroupsQueryResult = Group[];
export type CreateGroupMutationResult = GetAllGroupsQueryResult[number];

import { env } from "@/env";
import { Logger } from "@/server/api/common/logger";
import { deleteExpiredGroups } from "@/server/api/routers/groups/cron/delete-expired-groups.cron";
import { type NextRequest } from "next/server";
import { z } from "zod";

export async function POST(request: NextRequest): Promise<Response> {
  Logger.info("DELETE_EXPIRED_GROUPS_CRON_JOB_START", "Starting cron job to delete expired groups");

  const authHeader = request.headers.get("Authorization");
  const bearerToken = z.string().startsWith("Bearer ").safeParse(authHeader);
  if (!bearerToken.success) {
    Logger.error("DELETE_EXPIRED_GROUPS_CRON_JOB_ERROR", "Unauthorized (no token)", authHeader);
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = bearerToken.data.split("Bearer ")[1];
  if (token !== env.SCHEDULER_AUTH_TOKEN) {
    Logger.error("DELETE_EXPIRED_GROUPS_CRON_JOB_ERROR", "Unauthorized (invalid token)");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const numOfDeletedGroups = await deleteExpiredGroups();
  Logger.info(
    "DELETE_EXPIRED_GROUPS_CRON_JOB_SUCCESS",
    `Deleted ${numOfDeletedGroups} expired groups`
  );

  return Response.json({ success: true }, { status: 200 });
}

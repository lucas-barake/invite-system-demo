import { db } from "@/server/database";
import { DateTime } from "luxon";

export async function deleteExpiredInvites(): Promise<void> {
  const currentTime = DateTime.now().toUTC().toJSDate();
  await db
    .deleteFrom("group_invites")
    .where("expiration_time", "<", currentTime)
    .limit(1000)
    .execute();
}

// const cronExpressionEveryTwelveHours = "0 */12 * * * ";
/* 
cron.schedule(cronExpressionEveryTwelveHours, async () => {
  logger.info("Running deleteExpiredInvites CRON job");
  await deleteExpiredInvites();
});
*/

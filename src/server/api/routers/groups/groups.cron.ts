import { db } from "@/server/database";
import { DateTime } from "luxon";

export async function deleteGroupsCronJob(): Promise<bigint> {
  return db
    .deleteFrom("groups")
    .where("deleted_at", "<", DateTime.now().minus({ days: 7 }).toUTC().toJSDate())
    .limit(5_000)
    .executeTakeFirst()
    .then((result) => result.numDeletedRows);
}

// const cronExpressionEveryTwelveHours = "0 */12 * * * ";
/* 
cron.schedule(cronExpressionEveryTwelveHours, async () => {
  logger.info("Running deleteGroups CRON job");
  await deleteGroupsCronJob();
});
*/

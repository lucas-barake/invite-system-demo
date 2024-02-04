import { db } from "@/server/database";
import { sql } from "kysely";

export async function deleteGroupsCronJob(): Promise<number | undefined> {
  const result = await sql`
    DELETE FROM "groups" USING (
      SELECT
        "id"
      FROM
        "groups"
      WHERE
        "deleted_at" < NOW() - INTERVAL '7 days'
      LIMIT
        5000
    ) AS "t"
    WHERE
      "groups"."id" = "t"."id";
  `.execute(db);

  return Number(result.numAffectedRows);
}

// const cronExpressionEveryTwelveHours = "0 */12 * * * ";
/* 
cron.schedule(cronExpressionEveryTwelveHours, async () => {
  logger.info("Running deleteGroups CRON job");
  await deleteGroupsCronJob();
});
*/

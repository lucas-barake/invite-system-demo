import { db } from "@/server/database";
import { sql } from "kysely";

export async function deleteExpiredInvites(): Promise<number | undefined> {
  const result = await sql`
    DELETE FROM "group_invites" USING (
      SELECT
        "group_id",
        "invitee_email"
      FROM
        "group_invites"
      WHERE
        "expiration_time" < NOW()
      LIMIT
        5000
    ) AS "t"
    WHERE
      "group_invites"."group_id" = "t"."group_id"
      AND "group_invites"."invitee_email" = "t"."invitee_email";
  `.execute(db);

  return Number(result.numAffectedRows);
}

// const cronExpressionEveryTwelveHours = "0 */12 * * * ";
/* 
cron.schedule(cronExpressionEveryTwelveHours, async () => {
  logger.info("Running deleteExpiredInvites CRON job");
  await deleteExpiredInvites();
});
*/

import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import { type DB } from "kysely-codegen";
import { env } from "@/env";
import pc from "picocolors";

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: env.DATABASE_URL,
  }),
});

export const db = new Kysely<DB>({
  dialect,
  log:
    env.NODE_ENV === "development"
      ? (event) => {
          const formattedSql = event.query.sql.replace(/\$(\d+)/g, (_, index) => {
            const param = event.query.parameters[Number(index) - 1];
            return param !== null && param !== undefined && typeof param.toString === "function"
              ? // eslint-disable-next-line @typescript-eslint/no-base-to-string
                pc.green(param.toString())
              : pc.red("UNKNOWN");
          });

          const kyselyLabel = pc.yellow(`[Kysely (${event.queryDurationMillis.toFixed(2)}ms)]`);
          console.debug(`\n${kyselyLabel}\n${formattedSql}\n`);
        }
      : undefined,
});

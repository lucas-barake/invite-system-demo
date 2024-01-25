import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import { type DB } from "kysely-codegen";
import { env } from "@/env";

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
                param.toString()
              : "UNKNOWN_PARAM";
          });

          console.debug(`[Kysely (${event.queryDurationMillis}ms)]\n${formattedSql}`);
        }
      : undefined,
});

import { Context } from "effect";
import { type Session } from "@/server/api/routers/auth/service/auth.service.types";

export class SessionContext extends Context.Tag("SessionContext")<
  // eslint-disable-next-line no-use-before-define
  SessionContext,
  Session
>() {}

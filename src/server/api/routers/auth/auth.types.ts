import { type Session } from "@/server/api/routers/auth/service/auth.service.types";

export type MeQueryResult = {
  user: Session["user"];
};

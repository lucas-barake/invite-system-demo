import { phoneRouter } from "@/server/api/routers/user/sub-routers/phone/phone.router";
import { createTRPCRouter } from "@/server/api/trpc";

export const userRouter = createTRPCRouter({
  phone: phoneRouter,
});

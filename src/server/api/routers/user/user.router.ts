import { phoneRouter } from "@/server/api/routers/user/phone/phone.router";
import { createTRPCRouter } from "@/server/api/trpc";

export const userRouter = createTRPCRouter({
  phone: phoneRouter,
});

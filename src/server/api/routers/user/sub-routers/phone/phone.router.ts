import { rateLimitMiddleware } from "@/server/api/common/middlewares/rate-limit.middleware";
import {
  sendPhoneOtpInput,
  verifyPhoneInput,
} from "@/server/api/routers/user/sub-routers/phone/phone.input";
import { phoneService } from "@/server/api/routers/user/sub-routers/phone/service/phone.service";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const phoneRouter = createTRPCRouter({
  verifyOtp: protectedProcedure
    .input(verifyPhoneInput)
    .use(async (opts) => {
      await rateLimitMiddleware(opts.ctx.session, {
        maxRequests: 3,
        per: [5, "minutes"],
        uniqueId: `verifyPhoneOtp:${opts.input.phone.phoneNumber}`,
      });
      return opts.next();
    })
    .mutation(({ ctx, input }) => {
      return phoneService.verifyOtp({
        input,
        session: ctx.session,
      });
    }),

  sendOtp: protectedProcedure
    .input(sendPhoneOtpInput)
    .use(async (opts) => {
      await rateLimitMiddleware(opts.ctx.session, {
        maxRequests: 3,
        per: [5, "minutes"],
        uniqueId: `sendPhoneOtp:${opts.input.phone.phoneNumber}`,
      });
      return opts.next();
    })
    .mutation(({ ctx, input }) => {
      void phoneService.sendOtp({
        input,
        session: ctx.session,
      });
    }),

  getOtpTtl: protectedProcedure.input(sendPhoneOtpInput).query(({ ctx, input }) => {
    return phoneService.getOtpTtl({
      input,
      session: ctx.session,
    });
  }),
});

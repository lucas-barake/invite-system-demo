import { rateLimit } from "@/server/api/common/middlewares/rate-limit";
import { sendPhoneOtpInput, verifyPhoneInput } from "@/server/api/routers/user/phone/phone.input";
import { phoneService } from "@/server/api/routers/user/phone/phone.service";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const phoneRouter = createTRPCRouter({
  verifyOtp: protectedProcedure
    .input(verifyPhoneInput)
    .use(async ({ input, ctx, next }) => {
      await rateLimit(ctx.session, {
        maxRequests: 3,
        per: [5, "minutes"],
        uniqueId: `verifyPhoneOtp:${input.phone.phoneNumber}`,
      });
      return next();
    })
    .mutation(({ ctx, input }) => {
      return phoneService.verifyOtp(input, ctx.session);
    }),

  sendOtp: protectedProcedure
    .input(sendPhoneOtpInput)
    .use(async ({ ctx, input, next }) => {
      await rateLimit(ctx.session, {
        maxRequests: 3,
        per: [5, "minutes"],
        uniqueId: `sendPhoneOtp:${input.phone.phoneNumber}`,
      });
      return next();
    })
    .mutation(({ ctx, input }) => {
      void phoneService.sendOtp(input, ctx.session);
    }),

  getOtpTtl: protectedProcedure.input(sendPhoneOtpInput).query(({ ctx, input }) => {
    return phoneService.getOtpTtl(input, ctx.session);
  }),
});

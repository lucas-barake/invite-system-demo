import { TimeInSeconds } from "@/server/api/common/enums/time-in-seconds.enum";
import { Logger } from "@/server/api/common/logger";
import { userRepository } from "@/server/api/common/repositories/user.repository";
import { type Session } from "@/server/api/routers/auth/auth.types";
import {
  type SendPhoneOtpInput,
  type VerifyPhoneInput,
} from "@/server/api/routers/user/phone/phone.input";
import { redis } from "@/server/redis";
import { TRPCError } from "@trpc/server";

class PhoneService {
  private readonly logger = new Logger(PhoneService.name);

  private getPhoneOtpRedisKey(
    phone: SendPhoneOtpInput["phone"],
    userId: Session["user"]["id"]
  ): string {
    return `phone-otp:${phone.countryCode}:${phone.phoneNumber}:${userId}`;
  }

  public async sendOtp(input: SendPhoneOtpInput, session: Session): Promise<void> {
    const redisKey = this.getPhoneOtpRedisKey(input.phone, session.user.id);
    const exists = (await redis.exists(redisKey)) === 1;
    if (exists) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Phone OTP already sent",
      });
    }

    const fourDigitOtp = Math.floor(1000 + Math.random() * 9000).toString();
    await redis.set(redisKey, fourDigitOtp, "EX", TimeInSeconds.FiveMinutes);

    /* 
    try {
      await smsService.sendMessage({ to: input.email, subject: "Verify your phone", body: `Your phone OTP is: ${fourDigitOtp}` });
      this.logger.info(
        `Phone OTP for ${input.phone.countryCode}${input.phone.phoneNumber}: ${fourDigitOtp}`
      );
    } catch (error) {
      this.logger.error(`Failed to send phone OTP to ${input.email}`, error);
      redis.del(this.getPhoneOtpRedisKey(input.email));
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to send phone OTP",
      });
    }
    */

    this.logger.info(
      `Phone OTP for ${input.phone.countryCode}${input.phone.phoneNumber}: ${fourDigitOtp}`
    );
  }

  public async verifyOtp(input: VerifyPhoneInput, session: Session): Promise<Session["user"]> {
    const redisKey = this.getPhoneOtpRedisKey(input.phone, session.user.id);
    const otpFromRedis = await redis.get(redisKey);
    if (otpFromRedis === null) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "OTP not found or has expired",
      });
    }

    if (input.otp !== otpFromRedis) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Invalid OTP provided",
      });
    }

    const newUserInfo = await userRepository.updateUserPhoneNumber(
      session.user.id,
      input.phone.phoneNumber
    );
    void redis.del(redisKey);
    this.logger.info(
      `Phone number ${input.phone.countryCode}${input.phone.phoneNumber} verified successfully.`
    );
    return newUserInfo;
  }

  public async getOtpTtl(input: SendPhoneOtpInput, session: Session): Promise<number> {
    const redisKey = this.getPhoneOtpRedisKey(input.phone, session.user.id);
    const ttl = await redis.ttl(redisKey);
    if (ttl === -2) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "OTP not found",
      });
    }
    if (ttl === -1) {
      this.logger.error(
        `Phone OTP for ${input.phone.countryCode}${input.phone.phoneNumber} does not have an expiration`
      );
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "OTP does not have an expiration",
      });
    }
    return ttl;
  }
}

export const phoneService = new PhoneService();

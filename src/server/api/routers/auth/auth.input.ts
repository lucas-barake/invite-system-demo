import { z } from "zod";
import { parsePhoneNumberWithError } from "libphonenumber-js/min";
import {
  countriesWithCodes,
  type CountryWithCode,
} from "@/app/_lib/components/header/user-dropdown-menu/settings-modal/update-phone-modal/countries-with-code";
import { createManyUnion } from "@/lib/utils/zod/create-many-union";

const countryCodes = countriesWithCodes.map((c) => c.code_2);
const countryCode = createManyUnion(
  countryCodes as typeof countryCodes & [string, string, ...string[]],
  {
    required_error: "You must select a country",
    invalid_type_error: "Invalid country code",
  }
);

export const sendPhoneOtpInput = z.object({
  phone: z
    .object({
      phoneNumber: z
        .string()
        .trim()
        .min(2, { message: "The phone number is too short" })
        .regex(/^[^+]*$/, { message: "Phone number should not start with a '+'" }),
      countryCode,
    })
    .refine(
      (v) => {
        try {
          const phoneNumber = parsePhoneNumberWithError(v.phoneNumber, v.countryCode);
          return phoneNumber.isValid();
        } catch (_error: unknown) {
          return false;
        }
      },
      {
        message: "Phone number does not match selected country",
        path: ["phoneNumber"],
      }
    )
    .transform((v) => ({
      phoneNumber: parsePhoneNumberWithError(v.phoneNumber, v.countryCode).nationalNumber,
      countryCode: v.countryCode,
    })),
});
export type SendPhoneOtpInput = z.infer<typeof sendPhoneOtpInput>;

export const verifyPhoneInput = sendPhoneOtpInput.merge(
  z.object({
    otp: z
      .string()
      .trim()
      .regex(/^[0-9]{4}$/, {
        message: "The OTP must be a 4-digit number",
      }),
  })
);
export type VerifyPhoneInput = z.infer<typeof verifyPhoneInput>;

export type ParseStringPhoneNumberResult =
  | { success: true; data: VerifyPhoneInput["phone"] }
  | { success: false; error: string };
export function parseStringPhoneNumber(phoneNumber: unknown): ParseStringPhoneNumberResult {
  try {
    if (typeof phoneNumber !== "string") {
      return {
        success: false,
        error: "Invalid phone number",
      };
    }
    const parsedPhoneNumber = parsePhoneNumberWithError(phoneNumber);
    return {
      success: true,
      data: {
        phoneNumber: parsedPhoneNumber.nationalNumber,
        countryCode: parsedPhoneNumber.country as CountryWithCode["code_2"],
      },
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: "Invalid phone number",
    };
  }
}

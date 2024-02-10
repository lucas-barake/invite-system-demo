import {
  type SendPhoneOtpInput,
  type VerifyPhoneInput,
} from "@/server/api/routers/user/sub-routers/phone/phone.input";
import { type Session } from "@/server/api/routers/auth/service/auth.service.types";

export type SendOtpArgs = {
  input: SendPhoneOtpInput;
  session: Session;
};

export type VerifyOtpArgs = {
  input: VerifyPhoneInput;
  session: Session;
};

export type GetOtpTtlArgs = {
  input: SendPhoneOtpInput;
  session: Session;
};

import React from "react";
import { Controller, useForm } from "react-hook-form";
import {
  verifyPhoneInput,
  type VerifyPhoneInput,
} from "@/server/api/routers/user/phone/phone.input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTimer } from "react-timer-hook";
import { DateTime, Duration } from "luxon";
import OTPInput from "react-otp-input";
import { z } from "zod";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { handleToastError } from "@/components/ui/toaster";
import { useSession } from "@/lib/stores/session-store";
import { TRPCError } from "@trpc/server";
import { FieldError } from "@/components/ui/field-error";

type Props = {
  phone: VerifyPhoneInput["phone"];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  closeParentModal: () => void;
};

export const OtpModal: React.FC<Props> = ({ phone, open, onOpenChange, closeParentModal }) => {
  const session = useSession();
  const timer = useTimer({
    expiryTimestamp: DateTime.now().toJSDate(),
    autoStart: false,
  });
  const otpTtlQuery = api.user.phone.getOtpTtl.useQuery(
    {
      phone,
    },
    {
      onSuccess(res) {
        timer.restart(
          DateTime.now()
            .plus(Duration.fromObject({ seconds: res }))
            .toJSDate()
        );
      },
    }
  );
  const form = useForm<VerifyPhoneInput>({
    defaultValues: {
      phone,
      otp: "",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
    resolver: zodResolver(verifyPhoneInput),
  });
  const verifyOtpMutation = api.user.phone.verifyOtp.useMutation({
    onSuccess(newUserInfo) {
      session.update({ user: newUserInfo });
      onOpenChange(false);
      closeParentModal();
      form.reset();
    },
    onError(error) {
      if (error instanceof TRPCError && error.code === "BAD_REQUEST") {
        form.reset();
      }
    },
  });
  function verifyOtp(data: VerifyPhoneInput): void {
    toast.promise(verifyOtpMutation.mutateAsync(data), {
      loading: "Verifying OTP...",
      success: "Phone verified!",
      error: handleToastError,
    });
  }

  const sendOtpMutation = api.user.phone.sendOtp.useMutation({
    onSuccess() {
      void otpTtlQuery.refetch();
    },
  });
  function resendOtp(): void {
    toast.promise(sendOtpMutation.mutateAsync({ phone }), {
      loading: "Sending OTP...",
      success: "OTP sent!",
      error: handleToastError,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Verify your phone</Dialog.Title>
          <Dialog.Description>Enter the verification code sent to your phone</Dialog.Description>
        </Dialog.Header>

        <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(verifyOtp)}>
          <Controller
            control={form.control}
            name="otp"
            render={({ field }): JSX.Element => (
              <OTPInput
                value={field.value}
                onChange={(v): void => {
                  if (z.coerce.number().safeParse(v).success) {
                    field.onChange(v);
                  }
                }}
                numInputs={4}
                containerStyle="flex justify-center gap-4 px-2 text-center"
                inputStyle={{
                  width: "3rem",
                  height: "3rem",
                }}
                renderInput={(props): JSX.Element => (
                  <input
                    {...props}
                    maxLength={1}
                    type="text"
                    inputMode="numeric"
                    pattern="\d{1}"
                    className="m-0 flex flex-col items-center justify-center rounded border border-border bg-background px-2 text-center text-lg outline-none ring-blue-700 focus:bg-background/90 focus:ring-1"
                  />
                )}
              />
            )}
          />

          <FieldError
            message={form.formState.errors.otp?.message}
            className="text-center font-bold"
          />

          {timer.isRunning && (
            <p className="mx-auto text-center text-sm text-muted-foreground">
              The verificaton code will expire in {timer.minutes} minute
              {timer.minutes === 1 ? "" : "s"} and {timer.seconds} second
              {timer.seconds === 1 ? "" : "s"}.
            </p>
          )}

          {!timer.isRunning && otpTtlQuery.data !== undefined && (
            <Button variant="outline" onClick={resendOtp} loading={sendOtpMutation.isLoading}>
              Resend Verification Code
            </Button>
          )}

          <Dialog.Footer>
            <Button type="submit" loading={verifyOtpMutation.isLoading}>
              Verify
            </Button>

            <Dialog.Trigger asChild>
              <Button
                variant="secondary"
                onClick={() => {
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
            </Dialog.Trigger>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog>
  );
};

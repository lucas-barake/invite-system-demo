import React from "react";
import { Controller, useForm } from "react-hook-form";
import { verifyPhoneInput, type VerifyPhoneInput } from "@/server/api/routers/auth/auth.input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTimer } from "react-timer-hook";
import { DateTime } from "luxon";
import OTPInput from "react-otp-input";
import { z } from "zod";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  phone: VerifyPhoneInput["phone"];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const OtpModal: React.FC<Props> = ({ phone, open, onOpenChange }) => {
  const form = useForm<VerifyPhoneInput>({
    defaultValues: {
      phone,
      otp: "",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
    resolver: zodResolver(verifyPhoneInput),
  });
  const timer = useTimer({
    expiryTimestamp: DateTime.now().toJSDate(),
    autoStart: false,
  });

  function handleSubmit(_data: VerifyPhoneInput): void {
    // Verify OTP
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Verify your phone</Dialog.Title>
          <Dialog.Description>Enter the verification code sent to your phone</Dialog.Description>
        </Dialog.Header>

        <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(handleSubmit)}>
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

          {form.formState.errors.otp !== undefined && (
            <span className="text-center text-sm font-bold text-destructive">
              {form.formState.errors.otp.message}
            </span>
          )}
        </form>

        {timer.isRunning && (
          <p className="max-w-sm text-center text-sm text-muted-foreground">
            The verificaton code will expire in {timer.minutes} minute
            {timer.minutes === 1 ? "" : "s"} and {timer.seconds} second
            {timer.seconds === 1 ? "" : "s"}.
          </p>
        )}

        <Dialog.Footer>
          <Button>Verify</Button>

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
      </Dialog.Content>
    </Dialog>
  );
};

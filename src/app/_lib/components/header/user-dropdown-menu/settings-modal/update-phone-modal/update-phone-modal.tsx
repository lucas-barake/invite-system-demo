import React from "react";
import { Dialog } from "@/components/ui/dialog";
import { useSession } from "@/lib/stores/session-store";
import {
  sendPhoneOtpInput,
  type SendPhoneOtpInput,
} from "@/server/api/routers/user/sub-routers/phone/phone.input";
import { countriesWithCodes } from "@/app/_lib/components/header/user-dropdown-menu/settings-modal/update-phone-modal/countries-with-code";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AsYouType } from "libphonenumber-js/min";
import { OtpModal } from "@/app/_lib/components/header/user-dropdown-menu/settings-modal/update-phone-modal/otp-modal";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { handleToastError } from "@/components/ui/toaster";
import { type ComboboxOption, ComboboxSelect } from "@/components/ui/combobox-select";
import { stringUtils } from "@/lib/utils/string-utils";
import { FieldError } from "@/components/ui/field-error";
import { isTRPCClientErrorWithCode } from "@/lib/utils/is-trpc-client-error-with-code";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const UpdatePhoneModal: React.FC<Props> = ({ open, onOpenChange }) => {
  const session = useSession();
  const [phone, setPhone] = React.useState<SendPhoneOtpInput["phone"] | null>(null);
  const [showOtpModal, setShowOtpModal] = React.useState(false);

  const form = useForm<SendPhoneOtpInput>({
    defaultValues: {
      phone: {
        phoneNumber: phone?.phoneNumber ?? "",
        countryCode: phone?.countryCode ?? countriesWithCodes[0].code_2,
      },
    },
    resolver: zodResolver(sendPhoneOtpInput),
    mode: "onChange",
    reValidateMode: "onChange",
  });
  const typedPhoneNumber = form.watch("phone");
  const selectedCountryCode = form.watch("phone.countryCode");
  const selectedCountryInfo = React.useMemo(() => {
    return (
      countriesWithCodes.find(
        (country) =>
          stringUtils.normalize(country.code_2) === stringUtils.normalize(selectedCountryCode)
      ) ?? countriesWithCodes[0]
    );
  }, [countriesWithCodes, selectedCountryCode]);
  const selectedCountryOption: ComboboxOption = {
    label: `${selectedCountryInfo.emoji} (${selectedCountryInfo.dial_code})`,
    value: selectedCountryInfo.code_2,
  };
  const countryOptions: ComboboxOption[] = React.useMemo(() => {
    return countriesWithCodes
      .sort((a, b) => a.name_en.localeCompare(b.name_en))
      .map((item) => ({
        label: `${item.emoji} ${item.name_en} (${item.dial_code})`,
        value: item.code_2,
      }));
  }, []);

  const apiUtils = api.useUtils();
  const sendOtpMutation = api.user.phone.sendOtp.useMutation();
  function handleSubmit(data: SendPhoneOtpInput): void {
    if (data.phone.phoneNumber === session.data?.user.phoneNumber) {
      form.setError("phone.phoneNumber", {
        type: "manual",
        message: "The new phone number cannot be the same as the current one.",
      });
      return;
    }

    const cachedData = apiUtils.user.phone.getOtpTtl.getData({ phone: data.phone });
    if (cachedData !== undefined) {
      // If the user has already requested an OTP for the same phone number, show the OTP modal
      setShowOtpModal(true);
      setPhone(data.phone);
      void apiUtils.user.phone.getOtpTtl.invalidate({ phone: typedPhoneNumber });
      return;
    }

    toast.promise(sendOtpMutation.mutateAsync(data), {
      loading: "Sending OTP...",
      success() {
        setShowOtpModal(true);
        setPhone(data.phone);
        return "OTP sent!";
      },
      error(error) {
        if (isTRPCClientErrorWithCode(error) && error.data.code === "TOO_MANY_REQUESTS") {
          setShowOtpModal(true);
          setPhone(data.phone);
        }
        return handleToastError(error);
      },
    });
  }

  return (
    <React.Fragment>
      {showOtpModal && phone !== null && (
        <OtpModal
          phone={phone}
          onOpenChange={setShowOtpModal}
          open={showOtpModal}
          closeParentModal={() => {
            onOpenChange(false);
            form.reset();
          }}
        />
      )}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Update Phone Number</Dialog.Title>
          </Dialog.Header>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-2">
            <div className="flex grow items-center gap-2">
              <ComboboxSelect
                buttonLabel="Select a country"
                defaultValue={selectedCountryOption.value}
                emptyLabel="No countries found"
                options={countryOptions}
                selectedOption={selectedCountryOption}
                placeholder="Search for a country"
                onValueChange={(value) => {
                  const newCountry = countriesWithCodes.find(
                    (item) => stringUtils.normalize(item.code_2) === stringUtils.normalize(value)
                  );
                  if (newCountry !== undefined) {
                    form.setValue("phone.countryCode", newCountry.code_2);
                  }
                }}
                filter={(value, search) => {
                  const currentCountry = countriesWithCodes.find(
                    (country) =>
                      stringUtils.normalize(country.code_2) === stringUtils.normalize(value)
                  );
                  return currentCountry !== undefined
                    ? currentCountry.name_en.toLowerCase().includes(search.toLowerCase())
                    : false;
                }}
              />

              <Controller
                name="phone.phoneNumber"
                control={form.control}
                render={({ field }) => {
                  return (
                    <Input
                      placeholder={selectedCountryInfo?.placeholder}
                      value={field.value}
                      onChange={(e) => {
                        let newValue = e.target.value;
                        const newFormattedValue = new AsYouType(selectedCountryInfo?.code_2).input(
                          newValue
                        );
                        if (
                          newValue.length < field.value.length &&
                          newFormattedValue === field.value
                        ) {
                          newValue = newValue.slice(0, -1);
                        }
                        field.onChange(new AsYouType(selectedCountryInfo?.code_2).input(newValue));
                      }}
                      type="tel"
                      error={form.formState.errors.phone !== undefined}
                    />
                  );
                }}
              />
            </div>

            <FieldError message={form.formState.errors.phone?.phoneNumber?.message} />

            <Dialog.Footer>
              <Button type="submit" className="ml-1" disabled={!form.formState.isValid}>
                Update
              </Button>

              <Dialog.Trigger asChild>
                <Button variant="secondary">Cancel</Button>
              </Dialog.Trigger>
            </Dialog.Footer>
          </form>
        </Dialog.Content>
      </Dialog>
    </React.Fragment>
  );
};

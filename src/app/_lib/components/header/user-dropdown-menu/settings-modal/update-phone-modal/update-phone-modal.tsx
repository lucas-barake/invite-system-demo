import React from "react";
import { Dialog } from "@/components/ui/dialog";
import { useSession } from "@/lib/stores/session-store";
import {
  parseStringPhoneNumber,
  sendPhoneOtpInput,
  type SendPhoneOtpInput,
} from "@/server/api/routers/auth/auth.input";
import {
  countriesWithCodes,
  type CountryWithCode,
} from "@/app/_lib/components/header/user-dropdown-menu/settings-modal/update-phone-modal/countries-with-code";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { CustomItemComponentProps } from "virtua";
import { Popover } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
import { Command } from "@/components/ui/command";
import { cn } from "@/lib/cn";
import { Input } from "@/components/ui/input";
import { AsYouType } from "libphonenumber-js/min";
import { OtpModal } from "@/app/_lib/components/header/user-dropdown-menu/settings-modal/update-phone-modal/otp-modal";

const Item = React.forwardRef<HTMLDivElement, CustomItemComponentProps>(
  ({ children, style }, ref) => {
    children = children as React.ReactElement;

    return React.cloneElement(children, {
      ref,
      style: {
        ...style,
        display: "flex",
        alignItems: "center",
        padding: "0.5rem 1rem",
      },
    });
  }
);
Item.displayName = "Item";

function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const UpdatePhoneModal: React.FC<Props> = ({ open, onOpenChange }) => {
  const session = useSession();
  const parsedSessionPhoneNumber = parseStringPhoneNumber(session.data?.user.phoneNumber);
  const [phone, setPhone] = React.useState<SendPhoneOtpInput["phone"] | null>(
    parsedSessionPhoneNumber.success ? parsedSessionPhoneNumber.data : null
  );
  const [openCombobox, setOpenCombobox] = React.useState(false);
  const initialCountry = React.useMemo(() => {
    if (phone !== null) {
      return (
        countriesWithCodes.find((c) => c.code_2 === phone?.countryCode) ?? countriesWithCodes[0]
      );
    }
    return countriesWithCodes[0];
  }, [phone]);
  const [selectedCountry, setSelectedCountry] = React.useState<CountryWithCode>(initialCountry);
  const [countryQuery, setCountryQuery] = React.useState<string>();
  const filteredCountries = React.useMemo(
    () =>
      countriesWithCodes.filter((c) => {
        return countryQuery === undefined
          ? true
          : normalize(c.name_en).includes(normalize(countryQuery));
      }),
    [countryQuery]
  );

  const [showOtpModal, setShowOtpModal] = React.useState(false);

  const form = useForm<SendPhoneOtpInput>({
    defaultValues: {
      phone: {
        phoneNumber: phone?.phoneNumber ?? "",
        countryCode: phone?.countryCode ?? selectedCountry.code_2,
      },
    },
    resolver: zodResolver(sendPhoneOtpInput),
    mode: "onChange",
    reValidateMode: "onChange",
  });
  const typedPhoneNumber = form.watch("phone");

  const isPhoneNumberDifferentFromSession = React.useMemo(() => {
    const sessionPhone = parsedSessionPhoneNumber.success ? parsedSessionPhoneNumber.data : null;
    if (sessionPhone === null) return true;
    return (
      sessionPhone.countryCode !== typedPhoneNumber?.countryCode ||
      sessionPhone.phoneNumber !== typedPhoneNumber?.phoneNumber
    );
  }, [parsedSessionPhoneNumber, typedPhoneNumber]);

  function handleSubmit(data: SendPhoneOtpInput): void {
    setPhone(data.phone);
    setShowOtpModal(true);
  }

  return (
    <React.Fragment>
      <OtpModal phone={phone!} onOpenChange={setShowOtpModal} open={showOtpModal} />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Update Phone Number</Dialog.Title>
          </Dialog.Header>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-2">
            <div className="flex grow items-center gap-2">
              <Popover
                open={openCombobox}
                onOpenChange={(): void => {
                  setOpenCombobox(!openCombobox);
                }}
              >
                <Popover.Trigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={true}
                    className="w-[125px] justify-between px-2.5"
                    title="Select country"
                  >
                    {selectedCountry.emoji} {selectedCountry.dial_code}
                    <ChevronsUpDown className="ml-1 size-4 shrink-0 opacity-50" />
                  </Button>
                </Popover.Trigger>

                <Popover.Content className="w-[300px] p-0">
                  <Command shouldFilter={false} defaultValue={selectedCountry.code_2}>
                    <Command.Input
                      placeholder="Search for a country"
                      value={countryQuery}
                      onValueChange={setCountryQuery}
                    />

                    <Command.Empty>There are no countries that match your search</Command.Empty>

                    <Command.List>
                      {filteredCountries.map((item) => (
                        <Command.Item
                          key={item.code_2}
                          onSelect={(): void => {
                            setSelectedCountry(item);
                            setOpenCombobox(false);
                            form.setValue("phone.countryCode", item.code_2);
                          }}
                          className="cursor-pointer"
                        >
                          <CheckIcon
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCountry === item ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {item.emoji} {item.name_en} ({item.dial_code})
                        </Command.Item>
                      ))}
                    </Command.List>
                  </Command>
                </Popover.Content>
              </Popover>

              <Controller
                name="phone.phoneNumber"
                control={form.control}
                render={({ field }) => {
                  return (
                    <Input
                      placeholder={selectedCountry.placeholder}
                      value={field.value}
                      onChange={(e) => {
                        let newValue = e.target.value;
                        const newFormattedValue = new AsYouType(selectedCountry.code_2).input(
                          newValue
                        );
                        if (
                          newValue.length < field.value.length &&
                          newFormattedValue === field.value
                        ) {
                          newValue = newValue.slice(0, -1);
                        }
                        field.onChange(new AsYouType(selectedCountry.code_2).input(newValue));
                      }}
                      type="tel"
                      error={form.formState.errors.phone !== undefined}
                    />
                  );
                }}
              />
            </div>

            {form.formState.errors.phone !== undefined && (
              <p className="text-destructive">{form.formState.errors.phone.phoneNumber?.message}</p>
            )}

            <Dialog.Footer>
              <Button
                type="submit"
                className="ml-1"
                disabled={!form.formState.isValid || !isPhoneNumberDifferentFromSession}
              >
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

import React from "react";
import { Popover } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command } from "@/components/ui/command";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/cn";

export type ComboboxOption = {
  value: string;
  label: string;
};
export type ComboboxProps = {
  emptyLabel: string;
  buttonLabel: string;
  selectedOption: ComboboxOption;
  options: ComboboxOption[];
  onValueChange: (value: ComboboxOption["value"]) => void;
  placeholder: string;
  defaultValue: string;
  filter?: (value: string, search: string) => boolean;
};

export const ComboboxSelect: React.FC<ComboboxProps> = ({
  emptyLabel,
  options,
  selectedOption,
  onValueChange,
  placeholder,
  defaultValue,
  buttonLabel,
  filter,
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[125px] justify-between px-2.5"
          title="Select country"
        >
          {selectedOption?.label ?? buttonLabel}
          <ChevronsUpDown className="ml-1 size-4 shrink-0 opacity-50" />
        </Button>
      </Popover.Trigger>

      <Popover.Content className="w-[300px] p-0">
        <Command
          defaultValue={defaultValue}
          filter={
            filter !== undefined ? (value, search) => (filter(value, search) ? 1 : 0) : undefined
          }
        >
          <Command.Input placeholder={placeholder} />

          <Command.Empty>{emptyLabel}</Command.Empty>

          <Command.List>
            {options.map((option) => (
              <Command.Item
                key={option.value}
                onSelect={(val) => {
                  onValueChange(val);
                  setOpen(false);
                }}
                className="cursor-pointer"
                value={option.value}
              >
                <CheckIcon
                  className={cn(
                    "mr-2 h-4 w-4",
                    option.value === selectedOption.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </Popover.Content>
    </Popover>
  );
};

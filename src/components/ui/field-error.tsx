import { cn } from "@/lib/cn";
import { type ComponentPropsWithoutRef } from "react";

type FieldErrorProps = {
  message: unknown;
} & ComponentPropsWithoutRef<"p">;

export const FieldError: React.FC<FieldErrorProps> = ({ message, className, ...rest }) => {
  if (typeof message !== "string" || message === "") {
    return null;
  }
  return (
    <p className={cn("text-sm text-red-500", className)} {...rest}>
      {message}
    </p>
  );
};

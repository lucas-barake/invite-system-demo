import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const inputVariants = cva(
  "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      error: {
        true: "ring-2 ring-destructive focus:ring-destructive focus-visible:ring-destructive focus-visible:ring-offset-2",
      },
    },
  }
);

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> &
  VariantProps<typeof inputVariants>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input type={type} className={cn(inputVariants({ className, error }))} ref={ref} {...props} />
    );
  }
);
Input.displayName = "Input";

export { Input };

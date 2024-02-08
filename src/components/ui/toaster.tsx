"use client";

import { TRPCClientError } from "@trpc/client";
import { useTheme } from "next-themes";
import React from "react";
import { Toaster as Sonner } from "sonner";

export function handleToastError(error: unknown, custom?: string): string {
  if (error instanceof Error) return error.message;
  if (error instanceof TRPCClientError) return custom ?? error.message;
  return "Unknown error";
}

type ToasterProps = React.ComponentProps<typeof Sonner>;

export const Toaster: React.FC<ToasterProps> = ({ ...props }) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      // eslint-disable-next-line tailwindcss/no-custom-classname
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-sm group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toast]:size-5 group-[.toast]:bg-muted group-[.toast]:text-foreground group-[.toast]:border-0 group-[.toast]:hover:!bg-destructive group-[.toast]:hover:!text-destructive-foreground",
          error: "group-[.toaster]:text-destructive",
          success: "group-[.toaster]:text-success-text",
        },
        duration: 5000,
      }}
      closeButton
      {...props}
    />
  );
};

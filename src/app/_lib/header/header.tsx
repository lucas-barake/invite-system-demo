"use client";

import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/stores/session-store";
import { api } from "@/trpc/react";
import { LogOutIcon } from "lucide-react";
import React from "react";

export const Header: React.FC = () => {
  const session = useSession();
  const logoutMutation = api.auth.logout.useMutation({
    onSuccess() {
      session.update(null);
    },
  });

  return (
    <header className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-border/40 bg-background/95 px-8 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <span>Groups App</span>

      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          logoutMutation.mutate();
        }}
        disabled={logoutMutation.isLoading || session.status === "loading"}
      >
        <LogOutIcon className="size-4" />
      </Button>
    </header>
  );
};

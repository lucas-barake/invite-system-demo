"use client";

import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/stores/session-store";
import { api } from "@/trpc/react";
import { LogOutIcon } from "lucide-react";
import React from "react";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/ui/avatar";
import { GroupInvitesModal } from "@/app/_lib/components/header/group-invites-modal";

export const Header: React.FC = () => {
  const session = useSession();
  const logoutMutation = api.auth.logout.useMutation({
    onSuccess() {
      window.location.reload();
    },
  });

  return (
    <header className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-border/40 bg-background/95 px-8 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <span>Groups App</span>

      <div className="flex flex-row items-center gap-2">
        <GroupInvitesModal />

        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <Button type="button" variant="ghost" size="icon">
              <Avatar className="size-6">
                <Avatar.Image src={session.data?.imageUrl ?? undefined} />
                <Avatar.Fallback>{session.data?.name?.[0]?.toUpperCase() ?? "?"}</Avatar.Fallback>
              </Avatar>
            </Button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Content align="end">
            <DropdownMenu.Item
              onClick={() => {
                logoutMutation.mutate();
              }}
              disabled={logoutMutation.isLoading || session.status === "loading"}
            >
              <LogOutIcon className="mr-2 size-4" />
              Logout
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>
    </header>
  );
};

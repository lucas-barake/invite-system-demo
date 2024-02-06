"use client";

import React from "react";
import { GroupInvitesModal } from "@/app/_lib/components/header/group-invites-modal";
import { UserDropdownMenu } from "@/app/_lib/components/header/user-dropdown-menu";

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-border/40 bg-background/95 px-8 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <span>Groups App</span>

      <div className="flex flex-row items-center gap-2">
        <GroupInvitesModal />

        <UserDropdownMenu />
      </div>
    </header>
  );
};

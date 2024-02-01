"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { type Group } from "@/server/api/routers/groups/groups.types";
import { api } from "@/trpc/react";
import { Settings2, Trash2, UserPlus2 } from "lucide-react";
import React from "react";
import { InviteMembersModal } from "@/app/_lib/components/group-card/owner-actions-menu/invite-members-modal";

type Props = {
  group: Group;
};

export const OwnerActionsMenu: React.FC<Props> = ({ group }) => {
  const [openInviteMembersModal, setOpenInviteMembersModal] = React.useState(false);
  const apiUtils = api.useUtils();
  const deleteMutation = api.groups.deleteGroup.useMutation({
    onSuccess() {
      void apiUtils.groups.getAllGroups.invalidate();
    },
  });

  return (
    <React.Fragment>
      <InviteMembersModal
        open={openInviteMembersModal}
        onOpenChange={setOpenInviteMembersModal}
        group={group}
      />

      <DropdownMenu>
        <DropdownMenu.Trigger asChild>
          <Button variant="ghost">
            <Settings2 className="size-4" />
          </Button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Content align="end">
          <DropdownMenu.Item
            className="flex flex-row gap-2"
            onClick={() => {
              setOpenInviteMembersModal(true);
            }}
          >
            <UserPlus2 className="size-4" />
            Invite Members
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onClick={() => {
              deleteMutation.mutate(group.id);
            }}
            disabled={deleteMutation.isLoading}
            className="flex flex-row gap-2 bg-destructive hover:bg-destructive/90 focus:bg-destructive/90"
          >
            <Trash2 className="size-4" />
            {deleteMutation.isLoading ? "Deleting..." : "Delete"}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>
    </React.Fragment>
  );
};

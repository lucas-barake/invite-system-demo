"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { type GetAllGroupsQueryResult } from "@/server/api/routers/groups/groups.types";
import { api } from "@/trpc/react";
import { Settings2, Trash2, UserPlus2 } from "lucide-react";
import React from "react";
import { InviteMembersModal } from "@/app/_lib/components/group-card/owner-actions-menu/invite-members-modal";
import { handleToastError } from "@/components/ui/toaster";
import { toast } from "sonner";

type Props = {
  group: GetAllGroupsQueryResult[number];
};

export const OwnerActionsMenu: React.FC<Props> = ({ group }) => {
  const [openInviteMembersModal, setOpenInviteMembersModal] = React.useState(false);
  const apiUtils = api.useUtils();
  const deleteMutation = api.groups.deleteGroup.useMutation();
  const undoDeleteMutation = api.groups.undoDeleteGroup.useMutation();

  function undoDeleteGroup(): void {
    void toast.promise(undoDeleteMutation.mutateAsync(group.id), {
      loading: "Restoring group...",
      success() {
        void apiUtils.groups.getAllGroups.invalidate();
        return `Group "${group.title}" restored`;
      },
      error: (error) => handleToastError(error, "Failed to restore group"),
    });
  }

  async function deleteGroup(): Promise<void> {
    void toast.promise(deleteMutation.mutateAsync(group.id), {
      loading: "Deleting group...",
      success() {
        void apiUtils.groups.getAllGroups.invalidate();
        return `Group "${group.title}" deleted`;
      },
      error: (error) => handleToastError(error, "Failed to delete group"),
      action: {
        label: "Undo",
        onClick: undoDeleteGroup,
      },
      duration: 15_000,
    });
  }

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
              void deleteGroup();
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

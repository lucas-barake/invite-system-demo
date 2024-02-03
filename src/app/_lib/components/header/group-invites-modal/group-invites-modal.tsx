"use client";

import React from "react";
import { api } from "@/trpc/react";
import { Dialog } from "@/components/ui/dialog";
import { PendingInviteRow } from "@/app/_lib/components/header/group-invites-modal/pending-invite-row";
import { BellIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

export const GroupInvitesModal: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const pendingInvitesQuery = api.groupInvites.getPendingInvitesForUser.useQuery(undefined, {
    staleTime: 1000 * 60, // 1 minute
  });
  const hasPendingInvites = (pendingInvitesQuery.data?.length ?? 0) > 0;
  React.useEffect(() => {
    if (hasPendingInvites) {
      toast.info("You have pending group invites", {
        duration: 15_000,
        action: {
          label: "View",
          onClick: () => {
            setOpen(true);
          },
        },
      });
    }
  }, [pendingInvitesQuery.data, hasPendingInvites]);
  const pendingInvites = pendingInvitesQuery.data ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "relative",
            hasPendingInvites && "bg-red-600 hover:bg-red-500 text-white animate-pulse"
          )}
        >
          <BellIcon className="size-5" />
        </Button>
      </Dialog.Trigger>

      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Group Invites</Dialog.Title>
          <Dialog.Description>
            {pendingInvites.length} pending invite{pendingInvites.length !== 1 && "s"}
          </Dialog.Description>
        </Dialog.Header>

        {pendingInvites.length === 0 ? (
          <p>No pending invites</p>
        ) : (
          <ul>
            {pendingInvites.map((invite) => (
              <PendingInviteRow pendingInvite={invite} key={invite.groupId} />
            ))}
          </ul>
        )}
      </Dialog.Content>
    </Dialog>
  );
};

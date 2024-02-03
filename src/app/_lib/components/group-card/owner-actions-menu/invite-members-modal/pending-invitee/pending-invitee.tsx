"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { handleToastError } from "@/components/ui/toaster";

type Props = {
  inviteeEmail: string;
  groupId: string;
};

export const PendingInvitee: React.FC<Props> = ({ inviteeEmail, groupId }) => {
  const apiUtils = api.useUtils();
  const removePendingInviteMutation = api.groupInvites.removePendingInvite.useMutation({
    onSuccess() {
      apiUtils.groupInvites.getPendingInvitesForGroup.setData(
        {
          groupId,
        },
        (cachedData) => {
          if (cachedData === undefined) return [];
          return cachedData.filter((email) => email !== inviteeEmail);
        }
      );
    },
  });

  return (
    <div className="flex items-center justify-between" key={inviteeEmail}>
      <span>{inviteeEmail}</span>

      <Button
        size="sm"
        variant="destructive"
        onClick={() => {
          void toast.promise(
            removePendingInviteMutation.mutateAsync({
              groupId,
              inviteeEmail,
            }),
            {
              loading: "Removing invite...",
              success: "Invite removed!",
              error: (error) => handleToastError(error, "Failed to remove invite"),
            }
          );
        }}
        loading={removePendingInviteMutation.isLoading}
      >
        Remove
      </Button>
    </div>
  );
};

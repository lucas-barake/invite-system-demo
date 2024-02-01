import React from "react";
import { CheckIcon, XIcon } from "lucide-react";
import { type GroupInvite } from "@/server/api/routers/groups/groups.types";
import { api } from "@/trpc/react";
import toast from "react-hot-toast";
import { handleToastError } from "@/components/ui/styled-toaster";

type Props = {
  pendingInvite: GroupInvite;
};

export const PendingInviteRow: React.FC<Props> = ({ pendingInvite }) => {
  const apiUtils = api.useUtils();
  const acceptInvite = api.groups.acceptGroupInvite.useMutation({
    onSuccess() {
      void apiUtils.groups.getAllGroups.invalidate();
      apiUtils.groups.getPendingInvitesForUser.setData(undefined, (cachedData) => {
        if (cachedData === undefined) return [];
        return cachedData.filter((invite) => invite.groupId !== pendingInvite.groupId);
      });
    },
  });
  const declineInvite = api.groups.declineGroupInvite.useMutation({
    onSuccess() {
      apiUtils.groups.getPendingInvitesForUser.setData(undefined, (cachedData) => {
        if (cachedData === undefined) return [];
        return cachedData.filter((invite) => invite.groupId !== pendingInvite.groupId);
      });
    },
  });

  function handleAccept(): void {
    void toast.promise(
      acceptInvite.mutateAsync({
        groupId: pendingInvite.groupId,
      }),
      {
        loading: "Accepting invite...",
        success: "Invite accepted!",
        error: handleToastError,
      }
    );
  }

  return (
    <li className="flex items-center justify-between border border-border px-3 py-2 text-sm">
      <p>{pendingInvite.title}</p>

      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-lg bg-green-500 p-1 disabled:cursor-not-allowed disabled:bg-green-600"
          onClick={() => {
            handleAccept();
          }}
          disabled={acceptInvite.isLoading}
        >
          <CheckIcon className="size-4" />
        </button>

        <button
          type="button"
          className="rounded-lg bg-destructive p-1 disabled:cursor-not-allowed disabled:bg-destructive/90"
          disabled={declineInvite.isLoading}
          onClick={() => {
            void toast.promise(
              declineInvite.mutateAsync({
                groupId: pendingInvite.groupId,
              }),
              {
                loading: "Declining invite...",
                success: "Invite declined!",
                error: handleToastError,
              }
            );
          }}
        >
          <XIcon className="size-4" />
        </button>
      </div>
    </li>
  );
};

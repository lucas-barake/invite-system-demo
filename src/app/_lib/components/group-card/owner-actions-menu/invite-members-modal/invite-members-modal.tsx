"use client";

import React from "react";
import { Dialog } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "@/lib/stores/session-store";
import { type Group } from "@/server/api/routers/groups/groups.types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { LucideMail } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { handleToastError } from "@/components/ui/toaster";
import {
  SendGroupInviteInput,
  type SendGroupInviteInputType,
} from "@/server/api/routers/groups/group-invites/group-invites.input";
import { PendingInvitee } from "@/app/_lib/components/group-card/owner-actions-menu/invite-members-modal/pending-invitee";
import { FieldError } from "@/components/ui/field-error";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group;
};

export const InviteMembersModal: React.FC<Props> = ({ open, onOpenChange, group }) => {
  const session = useSession();

  const apiUtils = api.useUtils();
  const pendingInvitesQuery = api.groupInvites.getPendingInvitesForGroup.useQuery(
    {
      groupId: group.id,
    },
    {
      staleTime: 1000 * 60 * 5,
    }
  );
  const sendInviteMutation = api.groupInvites.sendGroupInvite.useMutation({
    onSuccess() {
      void apiUtils.groupInvites.getPendingInvitesForGroup.invalidate({
        groupId: group.id,
      });
    },
  });

  const form = useForm<SendGroupInviteInputType>({
    defaultValues: {
      email: "",
      groupId: group.id,
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
    resolver: zodResolver(
      SendGroupInviteInput.refine((data) => data.email !== session.data?.user.email, {
        message: "You can't invite yourself",
        path: ["email"],
      }).refine((data) => !group.members.some((member) => member.email === data.email), {
        message: "User is already a member",
        path: ["email"],
      })
    ),
  });

  async function handleSubmit(data: SendGroupInviteInputType): Promise<void> {
    void toast.promise(
      sendInviteMutation.mutateAsync({
        groupId: group.id,
        email: data.email,
      }),
      {
        loading: "Sending invite...",
        success() {
          form.reset();
          return "Invite sent!";
        },
        error: (error) => handleToastError(error, "Failed to send invite"),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Invite Members</Dialog.Title>
        </Dialog.Header>

        <form className="flex flex-col gap-2" onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="grid w-full items-center gap-2">
            <div className="flex items-center justify-between gap-3 sm:justify-start">
              <Label htmlFor="email">Invite a Member</Label>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 sm:flex-row">
            <Input
              type="email"
              placeholder="Email"
              autoComplete="off"
              id="email"
              required
              {...form.register("email")}
            />

            <Button
              size="sm"
              className="w-full text-sm sm:w-auto sm:text-base"
              type="submit"
              loading={sendInviteMutation.isLoading}
            >
              {!sendInviteMutation.isLoading && <LucideMail className="mr-1.5 size-4 sm:size-5" />}
              Invite
            </Button>
          </div>

          <FieldError message={form.formState.errors.email?.message} />
        </form>

        {group.members.length > 0 && (
          <div className="flex flex-col gap-2">
            {group.members.map((member) => (
              <p key={member.id} className="border border-border px-2 py-1">
                {member.email}
              </p>
            ))}
          </div>
        )}

        <Separator />

        {pendingInvitesQuery.isFetching ? (
          <p>Loading pending invites...</p>
        ) : (
          <div className="flex flex-col gap-2">
            <h3 className="font-bold">Pending Invites</h3>

            <div className="flex flex-col gap-2">
              {pendingInvitesQuery.data?.map((inviteeEmail) => (
                <PendingInvitee inviteeEmail={inviteeEmail} key={inviteeEmail} groupId={group.id} />
              ))}
            </div>
          </div>
        )}

        <Separator />

        <Dialog.Footer>
          <Dialog.Trigger asChild>
            <Button variant="secondary" size="sm">
              Close
            </Button>
          </Dialog.Trigger>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};

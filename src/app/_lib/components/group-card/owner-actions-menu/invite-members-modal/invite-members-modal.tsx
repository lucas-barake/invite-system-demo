"use client";

import React from "react";
import { Dialog } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import {
  SendGroupInviteInput,
  type SendGroupInviteInputType,
} from "@/server/api/routers/groups/groups.input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "@/lib/stores/session-store";
import { type Group } from "@/server/api/routers/groups/groups.types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { LucideMail } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import toast from "react-hot-toast";
import { handleToastError } from "@/components/ui/styled-toaster";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group;
};

export const InviteMembersModal: React.FC<Props> = ({ open, onOpenChange, group }) => {
  const session = useSession();
  const form = useForm<SendGroupInviteInputType>({
    defaultValues: {
      email: "",
      groupId: group.id,
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
    resolver: zodResolver(
      SendGroupInviteInput.refine((data) => data.email !== session.data?.email, {
        message: "You can't invite yourself",
        path: ["email"],
      }).refine((data) => !group.members.some((member) => member.email === data.email), {
        message: "User is already a member",
        path: ["email"],
      })
    ),
  });
  const sendInviteMutation = api.groups.sendGroupInvite.useMutation();

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
          onOpenChange(false);
          return "Invite sent!";
        },
        error: handleToastError,
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Invite Members</Dialog.Title>
        </Dialog.Header>

        <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(handleSubmit)}>
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

          <p className="text-destructive">{form.formState.errors.email?.message}</p>
        </form>

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

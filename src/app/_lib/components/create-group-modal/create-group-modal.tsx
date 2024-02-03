import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateGroupInput,
  type CreateGroupInputType,
} from "@/server/api/routers/groups/groups.input";
import { toast } from "sonner";
import { handleToastError } from "@/components/ui/toaster";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const CreateGroupModal: React.FC<Props> = (props) => {
  const form = useForm<CreateGroupInputType>({
    defaultValues: {
      title: "",
    },
    resolver: zodResolver(CreateGroupInput),
  });
  const apiUtils = api.useUtils();
  const createGroup = api.groups.createGroup.useMutation({
    onSuccess() {
      void apiUtils.groups.getAllGroups.invalidate();
    },
  });

  async function handleSubmit(data: CreateGroupInputType): Promise<void> {
    void toast.promise(createGroup.mutateAsync(data), {
      loading: "Creating group...",
      success() {
        form.reset();
        props.onOpenChange(false);
        return "Group created!";
      },
      error: (error) => handleToastError(error, "Failed to create group"),
    });
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Create Group</Dialog.Title>
        </Dialog.Header>

        <form className="flex flex-col gap-2" onSubmit={form.handleSubmit(handleSubmit)}>
          <Label>
            Title
            <Input type="text" {...form.register("title")} />
          </Label>

          <Button type="submit" loading={createGroup.isLoading}>
            Create
          </Button>
        </form>
      </Dialog.Content>
    </Dialog>
  );
};

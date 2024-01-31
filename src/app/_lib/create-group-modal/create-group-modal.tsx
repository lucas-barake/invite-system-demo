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
  const createGroup = api.groups.create.useMutation({
    onSuccess() {
      void apiUtils.groups.getAll.invalidate();
    },
  });

  async function handleSubmit(data: CreateGroupInputType): Promise<void> {
    await createGroup.mutateAsync(data);
    props.onOpenChange(false);
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

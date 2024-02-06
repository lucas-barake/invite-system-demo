import React from "react";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { LogOutIcon, Settings } from "lucide-react";
import { useSession } from "@/lib/stores/session-store";
import { api } from "@/trpc/react";
import { SettingsModal } from "@/app/_lib/components/header/user-dropdown-menu/settings-modal";

export const UserDropdownMenu: React.FC = () => {
  const [openSettings, setOpenSettings] = React.useState(false);
  const session = useSession();
  const logoutMutation = api.auth.logout.useMutation({
    onSuccess() {
      window.location.reload();
    },
  });

  return (
    <React.Fragment>
      <SettingsModal open={openSettings} onOpenChange={setOpenSettings} />

      <DropdownMenu>
        <DropdownMenu.Trigger asChild>
          <Button type="button" variant="ghost" size="icon">
            <Avatar className="size-6">
              <Avatar.Image src={session.data?.user.imageUrl ?? undefined} />
              <Avatar.Fallback>
                {session.data?.user.name?.[0]?.toUpperCase() ?? "?"}
              </Avatar.Fallback>
            </Avatar>
          </Button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Content align="end">
          <DropdownMenu.Item
            onClick={() => {
              setOpenSettings(true);
            }}
          >
            <Settings className="mr-2 size-4" />
            Settings
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onClick={() => {
              logoutMutation.mutate();
            }}
            disabled={logoutMutation.isLoading || session.status === "loading"}
          >
            <LogOutIcon className="mr-2 size-4" />
            Logout
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>
    </React.Fragment>
  );
};

import React from "react";
import { Dialog } from "@/components/ui/dialog";
import { useSession } from "@/lib/stores/session-store";
import { Button } from "@/components/ui/button";
import { UpdatePhoneModal } from "src/app/_lib/components/header/user-dropdown-menu/settings-modal/update-phone-modal";
import { Edit, PlusIcon } from "lucide-react";
import { parsePhoneNumber } from "libphonenumber-js/min";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
``;

export const SettingsModal: React.FC<Props> = ({ open, onOpenChange }) => {
  const session = useSession();
  const [showPhoneModal, setShowPhoneModal] = React.useState(false);

  function handlePhoneModalOpenChange(newOpen: boolean): void {
    if (newOpen) {
      setShowPhoneModal(true);
      onOpenChange(false);
    } else {
      setShowPhoneModal(false);
      onOpenChange(true);
    }
  }

  return (
    <React.Fragment>
      <UpdatePhoneModal open={showPhoneModal} onOpenChange={handlePhoneModalOpenChange} />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Settings</Dialog.Title>
            <Dialog.Description>Configure your settings</Dialog.Description>
          </Dialog.Header>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold">Name</span>
            <span>{session.data?.user.name}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold">Email</span>
            <span>{session.data?.user.email}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold">Phone Number</span>

            <div className="flex items-center gap-3">
              <span>
                {session.data?.user.phoneNumber !== undefined &&
                session.data?.user.phoneNumber !== null
                  ? parsePhoneNumber(session.data.user.phoneNumber).formatInternational()
                  : "No phone number"}
              </span>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  handlePhoneModalOpenChange(true);
                }}
              >
                {session.data?.user.phoneNumber === null ? (
                  <React.Fragment>
                    Add
                    <PlusIcon className="ml-2 size-4" />
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    Edit
                    <Edit className="ml-2 size-4" />
                  </React.Fragment>
                )}
              </Button>
            </div>
          </div>

          <Dialog.Footer>
            <Dialog.Trigger asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </Dialog.Trigger>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </React.Fragment>
  );
};

import { Separator } from "@/components/ui/separator";
import { XIcon } from "lucide-react";
import React from "react";

type Props = {
  onUndo: () => void;
  onDismiss: () => void;
};

export const UndoActionToast: React.FC<Props> = ({ onUndo, onDismiss }) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span>Successfully deleted group</span>

        <button
          type="button"
          className="text-blue-500 hover:underline"
          onClick={() => {
            onUndo();
          }}
        >
          Undo
        </button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <button
        type="button"
        onClick={() => {
          onDismiss();
        }}
      >
        <XIcon className="size-4" />
      </button>
    </div>
  );
};

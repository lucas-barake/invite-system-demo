import { OwnerActionsMenu } from "@/app/_lib/components/group-card/owner-actions-menu";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/stores/session-store";
import { type GetAllGroupsQueryResult } from "@/server/api/routers/groups/groups.types";
import { CalendarIcon } from "lucide-react";
import { DateTime } from "luxon";
import React from "react";
import { Separator } from "@/components/ui/separator";
import { Tooltip } from "@/components/ui/tooltip";

type Props = {
  group: GetAllGroupsQueryResult[number];
};

export const GroupCard: React.FC<Props> = ({ group }) => {
  const session = useSession();
  const isOwner = group.owner.id === session.data?.user.id;

  return (
    <div className="relative flex flex-col gap-4 rounded-lg border border-border p-6 shadow-sm">
      <div className="flex w-full items-center justify-between gap-4">
        <span className="max-w-[250px] text-lg font-bold">{group.title}</span>

        <div className="flex -space-x-2 overflow-hidden">
          {[group.owner, ...group.members].map((member) => (
            <Tooltip.Provider key={member.email}>
              <Tooltip delayDuration={100}>
                <Tooltip.Trigger asChild>
                  <Avatar className="size-7">
                    <Avatar.Image src={member.imageUrl ?? undefined} />

                    <Avatar.Fallback>
                      {member.name?.[0]?.toUpperCase() ?? member.email?.[0]?.toUpperCase() ?? "?"}
                    </Avatar.Fallback>
                  </Avatar>
                </Tooltip.Trigger>

                <Tooltip.Content sideOffset={8} side="bottom" className="flex flex-col">
                  <span>{member.name}</span>
                  <span className="text-sm text-muted-foreground">({member.email})</span>
                </Tooltip.Content>
              </Tooltip>
            </Tooltip.Provider>
          ))}
        </div>
      </div>

      <Separator />

      <div className="mt-auto flex w-full items-center justify-between">
        <Badge variant="secondary">
          <CalendarIcon className="mr-2 size-4" />
          {DateTime.fromJSDate(group.created_at!).toLocaleString(DateTime.DATE_MED)}
        </Badge>

        {isOwner && <OwnerActionsMenu group={group} />}
      </div>
    </div>
  );
};

export const GroupCardSkeleton: React.FC = () => {
  return (
    <div className="relative flex animate-pulse flex-col gap-2 rounded-lg border border-border p-6 shadow-sm">
      <Skeleton className="h-6 w-3/4" />

      <div className="mt-12 flex w-full items-center justify-between">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  );
};

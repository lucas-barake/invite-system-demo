"use client";

import React from "react";
import { CreateGroupModal } from "@/app/_lib/components/create-group-modal";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { Header } from "@/app/_lib/components/header";
import { GroupCard, GroupCardSkeleton } from "@/app/_lib/components/group-card";

const Home: React.FC = () => {
  const [openCreateGroupModal, setOpenCreateGroupModal] = React.useState(false);
  const groupsQuery = api.groups.getAllGroups.useQuery(undefined, {
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <main>
      <Header />

      <CreateGroupModal open={openCreateGroupModal} onOpenChange={setOpenCreateGroupModal} />

      <div className="flex w-full flex-col gap-4 px-12 py-4">
        <Button
          onClick={() => {
            setOpenCreateGroupModal(true);
          }}
          className="self-start"
        >
          Create Group
        </Button>

        <div className="grid grow grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {groupsQuery.data !== undefined && !groupsQuery.isFetching
            ? groupsQuery.data.map((group) => <GroupCard group={group} key={group.id} />)
            : Array.from({ length: 4 }).map((_, i) => <GroupCardSkeleton key={i} />)}
        </div>
      </div>
    </main>
  );
};

export default Home;

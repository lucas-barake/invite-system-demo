"use client";

import React from "react";
import { CreateGroupModal } from "@/app/_lib/create-group-modal";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { Header } from "@/app/_lib/header";
import { GroupCard, GroupCardSkeleton } from "@/app/_lib/group-card/group-card";

const Home: React.FC = () => {
  const [openCreateGroupModal, setOpenCreateGroupModal] = React.useState(false);
  const todosQuery = api.groups.getAll.useQuery(undefined, {
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <main>
      <Header />

      <CreateGroupModal open={openCreateGroupModal} onOpenChange={setOpenCreateGroupModal} />

      <div className="px-12 py-4">
        <Button
          onClick={() => {
            setOpenCreateGroupModal(true);
          }}
        >
          Create Group
        </Button>

        <div className="mt-4 grid grid-cols-4 gap-4">
          {todosQuery.data !== undefined && !todosQuery.isFetching
            ? todosQuery.data.map((group) => <GroupCard group={group} key={group.id} />)
            : Array.from({ length: 4 }).map((_, i) => <GroupCardSkeleton key={i} />)}
        </div>
      </div>
    </main>
  );
};

export default Home;

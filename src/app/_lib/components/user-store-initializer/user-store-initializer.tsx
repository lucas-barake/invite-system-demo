"use client";

import React from "react";
import { useSession } from "@/lib/stores/session-store";
import { type MeQueryResult } from "@/server/api/routers/auth/auth.types";

type Props = {
  user: MeQueryResult | null;
};

export const UserStoreInitializer: React.FC<Props> = ({ user }) => {
  const initialized = React.useRef(false);

  if (!initialized.current) {
    initialized.current = true;
    useSession.setState({
      data: user,
      status: user !== null ? "authenticated" : "unauthenticated",
    });
  }

  return null;
};

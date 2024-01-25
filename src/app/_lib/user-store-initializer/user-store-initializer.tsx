"use client";

import React from "react";
import { type User } from "@/server/api/repositories/user-repository";
import { useSession } from "@/lib/stores/session-store";

type Props = {
  user: User | null;
};

export const UserStoreInitializer: React.FC<Props> = ({ user }) => {
  const initialized = React.useRef(false);

  if (!initialized.current) {
    initialized.current = true;
    useSession.setState({ data: user });
  }

  return null;
};

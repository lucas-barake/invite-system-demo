"use client";

import { useSession } from "@/lib/stores/session-store";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

type Props = {
  children: React.ReactNode;
};

export const AuthGuard: React.FC<Props> = ({ children }) => {
  const user = useSession();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (pathname === "/login" && user.status === "authenticated") {
      router.push("/");
    }

    if (user.status === "unauthenticated") {
      router.push("/login");
    }
  }, [user.status, pathname, router]);

  if (user.status === "loading" || (user.status === "unauthenticated" && pathname !== "/login")) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  return children;
};

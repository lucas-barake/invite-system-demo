import { create } from "zustand";
import { type MeQueryResult } from "@/server/api/routers/auth/auth.types";

export type Session = {
  data: MeQueryResult | null;
  status: "authenticated" | "unauthenticated" | "loading";
  update: (data: MeQueryResult | null) => void;
};

export const useSession = create<Session>((set) => ({
  data: null,
  status: "loading",
  update(data: MeQueryResult | null) {
    set({ data, status: data !== null ? "authenticated" : "unauthenticated" });
  },
}));

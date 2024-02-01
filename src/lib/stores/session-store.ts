import { create } from "zustand";
import { type User } from "@/server/api/common/repositories/user-repository";

export type Session = {
  data: User | null;
  status: "authenticated" | "unauthenticated" | "loading";
  update: (data: User | null) => void;
};

export const useSession = create<Session>((set) => ({
  data: null,
  status: "loading",
  update(data: User | null) {
    set({ data, status: data !== null ? "authenticated" : "unauthenticated" });
  },
}));

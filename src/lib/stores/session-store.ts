import { create } from "zustand";
import { type User } from "@/server/api/repositories/user-repository";

export type Session = {
  data: User | null;
  status: "authenticated" | "unauthenticated";
  update: (data: User | null) => void;
};

export const useSession = create<Session>((set) => ({
  data: null,
  status: "unauthenticated",
  update(data: User | null) {
    set({ data, status: data !== null ? "authenticated" : "unauthenticated" });
  },
}));

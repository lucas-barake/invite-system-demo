import { create } from "zustand";
import { type MeQueryResult } from "@/server/api/routers/auth/auth.types";

export type ClientSession = {
  data: MeQueryResult | null;
  status: "authenticated" | "unauthenticated" | "loading";
  update: (data: MeQueryResult | null) => void;
};

export const useSessionStore = create<ClientSession>((set) => ({
  data: null,
  status: "loading",
  update(data: MeQueryResult | null) {
    set({ data, status: data !== null ? "authenticated" : "unauthenticated" });
  },
}));

export type UseSessionOptions = {
  onUpdate?: (data: MeQueryResult | null) => void;
};
export type UseSessionReturn = {
  data: MeQueryResult | null;
  status: "authenticated" | "unauthenticated" | "loading";
  update: (data: MeQueryResult | null) => void;
};
export function useSession(options?: UseSessionOptions): ClientSession {
  const sessionStore = useSessionStore();
  return {
    data: sessionStore.data,
    status: sessionStore.status,
    update(data) {
      sessionStore.update(data);
      options?.onUpdate?.(data);
    },
  };
}

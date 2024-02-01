"use client";

import React from "react";
import { api } from "@/trpc/react";
import { useSession } from "@/lib/stores/session-store";
import { signInWithGoogle } from "@/lib/configs/firebase-config";

export const AuthScreen: React.FC = () => {
  const session = useSession();
  const loginMutation = api.auth.login.useMutation({
    onSuccess(data) {
      session.update(data);
    },
  });

  async function handleSignIn(): Promise<void> {
    try {
      const userCredentials = await signInWithGoogle();
      const accessToken = await userCredentials.user.getIdToken();

      void loginMutation.mutateAsync({
        accessToken,
      });
    } catch (error: unknown) {
      console.error(error);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2 p-24">
      <button
        type="button"
        className="rounded-md bg-indigo-500 px-4 py-2 text-white shadow disabled:opacity-50"
        onClick={handleSignIn}
        disabled={
          loginMutation.isLoading ||
          session.status === "loading" ||
          session.status === "authenticated"
        }
      >
        {loginMutation.isLoading ? "Loading..." : "Sign in with Google"}
      </button>
    </div>
  );
};

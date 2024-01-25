"use client";

import React from "react";
import { signInWithGoogle } from "@/lib/configs/firebase-config";
import { api } from "@/trpc/react";
import { useSession } from "@/lib/stores/session-store";

export const AuthScreen: React.FC = () => {
  const session = useSession();
  const loginMutation = api.auth.login.useMutation({
    onSuccess(data) {
      session.update(data);
    },
  });
  const logoutMutation = api.auth.logout.useMutation({
    onSuccess() {
      session.update(null);
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
      {session.data !== null && (
        <code className="text-center">{JSON.stringify(session.data, null, 2)}</code>
      )}

      {session.data === null && (
        <button
          type="button"
          className="rounded-md bg-indigo-500 px-4 py-2 text-white shadow disabled:opacity-50"
          onClick={handleSignIn}
        >
          {loginMutation.isLoading ? "Loading..." : "Sign in with Google"}
        </button>
      )}

      {session.data !== null && (
        <button
          type="button"
          className="rounded-md bg-indigo-500 px-4 py-2 text-white shadow disabled:opacity-50"
          onClick={() => {
            logoutMutation.mutate();
          }}
          disabled={logoutMutation.isLoading}
        >
          {logoutMutation.isLoading ? "Loading..." : "Sign out"}
        </button>
      )}
    </div>
  );
};

import { AuthScreen } from "src/app/_lib/auth-screen";
import React from "react";
import { api } from "@/trpc/server";
import { UserStoreInitializer } from "@/app/_lib/user-store-initializer";
import { type User } from "@/server/api/repositories/user-repository";
import { unstable_noStore } from "next/cache";

async function getMe(): Promise<User | null> {
  try {
    return await api.auth.me.query();
  } catch {
    return null;
  }
}

const Home: React.FC = async () => {
  unstable_noStore();
  const user = await getMe();

  return (
    <main>
      <UserStoreInitializer user={user} />
      <AuthScreen />
    </main>
  );
};

export default Home;

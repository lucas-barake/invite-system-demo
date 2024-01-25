import { getApp, getApps, initializeApp } from "@firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "@firebase/auth";
import { env } from "@/env";

export const firebaseApp =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      });
export const auth = getAuth(firebaseApp);
export const googleAuthProvider = new GoogleAuthProvider();

export function signInWithGoogle(): ReturnType<typeof signInWithPopup> {
  return signInWithPopup(auth, googleAuthProvider);
}

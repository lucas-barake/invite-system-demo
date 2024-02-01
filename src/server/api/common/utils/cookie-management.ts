import { env } from "@/env";

export function createSecureCookie(args: {
  headers: Headers;
  expiresInSeconds: number;
  name: string;
  value: string;
}): void {
  const secure = env.NODE_ENV === "production" ? "Secure;" : "";
  const expiresInMs = args.expiresInSeconds * 1000;
  const cookie = `${args.name}=${args.value}; HttpOnly; Path=/; SameSite=Lax; ${secure} Expires=${new Date(
    Date.now() + expiresInMs
  ).toUTCString()}`;
  args.headers.append("Set-Cookie", cookie);
}

export function deleteCookie(args: { headers: Headers; name: string }): void {
  const secure = env.NODE_ENV === "production" ? "Secure;" : "";
  const cookie = `${args.name}=; HttpOnly; Path=/; SameSite=Lax; ${secure} Expires=${new Date(0).toUTCString()}`;
  args.headers.append("Set-Cookie", cookie);
}

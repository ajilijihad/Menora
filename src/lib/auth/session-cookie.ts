import { cookies } from "next/headers";

export async function hasAuthSessionCookie(): Promise<boolean> {
  const store = await cookies();
  return store.getAll().some(
    (cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token") && cookie.value.length > 0,
  );
}

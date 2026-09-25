import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { SESSION_COOKIE, verifySession } from "@/lib/session";

export const getSession = cache(async () => {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
});

/** For pages/layouts: bounce to /login when not signed in. */
export async function requirePageAuth() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** For server actions / route handlers: throw when not signed in. */
export async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");
  return session;
}

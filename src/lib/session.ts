import { SignJWT, jwtVerify } from "jose";

/** Shared by proxy.ts (edge-safe) and server code. */
export const SESSION_COOKIE = "bos_session";
export const SESSION_DAYS = 30;

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) return null;
  return new TextEncoder().encode(secret);
}

export async function signSession(email: string) {
  const key = secretKey();
  if (!key) throw new Error("AUTH_SECRET is missing or too short (min 16 chars).");
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(key);
}

export async function verifySession(token?: string | null): Promise<{ email: string } | null> {
  const key = secretKey();
  if (!token || !key) return null;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    if (typeof payload.email !== "string") return null;
    const admin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (admin && payload.email !== admin) return null;
    return { email: payload.email };
  } catch {
    return null;
  }
}

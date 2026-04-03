import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "ne_session";

/** HS256 key bytes; set AUTH_SECRET in production (32+ random chars recommended). */
export function getJwtSecretKey() {
  const s = process.env.AUTH_SECRET?.trim();
  if (s) return new TextEncoder().encode(s);
  return new TextEncoder().encode(
    "dev-only-auth-secret-replace-with-AUTH_SECRET-32chars"
  );
}

export async function createSessionToken() {
  return new SignJWT({ sub: "user" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getJwtSecretKey());
}

export async function verifySessionToken(token: string) {
  try {
    await jwtVerify(token, getJwtSecretKey());
    return true;
  } catch {
    return false;
  }
}

export function getExpectedCredentials() {
  return {
    username: process.env.APP_LOGIN_USER?.trim() || "admin",
    password: process.env.APP_LOGIN_PASSWORD?.trim() || "ACN2026",
  };
}

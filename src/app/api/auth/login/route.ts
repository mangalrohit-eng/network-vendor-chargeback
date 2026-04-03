import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  createSessionToken,
  getExpectedCredentials,
} from "@/lib/auth-session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { username?: string; password?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { username, password } = body;
  const expected = getExpectedCredentials();

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    username !== expected.username ||
    password !== expected.password
  ) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}

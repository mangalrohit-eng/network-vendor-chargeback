"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Sign in failed");
        return;
      }
      const from = searchParams.get("from");
      router.push(from && from.startsWith("/") && !from.startsWith("//") ? from : "/");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
      <div className="w-full max-w-[380px] border border-zinc-300 bg-white p-8">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
          Sign in
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Enter your credentials to continue.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-medium uppercase tracking-wide text-zinc-600"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1.5 w-full border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium uppercase tracking-wide text-zinc-600"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              required
            />
          </div>

          {error && (
            <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full border border-zinc-800 bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {pending ? "Signing in…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

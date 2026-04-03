import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 text-sm text-zinc-600">
        Loading…
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

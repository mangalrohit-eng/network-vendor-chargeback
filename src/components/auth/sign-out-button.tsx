"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton({
  variant = "outline",
  size = "sm",
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={logout}
      {...props}
    >
      <LogOut className="h-4 w-4" aria-hidden />
      Sign out
    </Button>
  );
}

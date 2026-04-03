"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Scale,
  KanbanSquare,
  Settings2,
  Home,
} from "lucide-react";
import { BrandLogos } from "@/components/brand/brand-logos";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Welcome", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tickets", label: "Tickets", icon: FileText },
  { href: "/contracts", label: "Contracts", icon: Scale },
  { href: "/pipeline", label: "Chargeback pipeline", icon: KanbanSquare },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-card">
        <Link
          href="/"
          className="flex flex-col gap-3 border-b border-border px-4 py-4 outline-none ring-offset-background transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BrandLogos variant="sidebar" />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Verizon · NE
            </p>
            <p className="truncate text-sm font-semibold leading-tight">
              Chargeback Console
            </p>
          </div>
        </Link>
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {nav.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 border border-transparent px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "border-border bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3 text-[10px] leading-relaxed text-muted-foreground">
          CTO Office · Network Engineering
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 items-center border-b border-border bg-card px-6">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Internal use
          </span>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}

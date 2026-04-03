import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Application access",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

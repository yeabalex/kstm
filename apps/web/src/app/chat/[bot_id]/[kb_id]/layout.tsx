import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Assistant Chat",
};

export default function ChatRouteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="min-h-screen bg-zinc-50 text-zinc-900">{children}</div>;
}

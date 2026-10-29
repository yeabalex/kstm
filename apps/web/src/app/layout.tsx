import type { Metadata, Viewport } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import clsx from "clsx";
import Cog from "@/assets/logo-acme.png";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "KSTM — Knowledge-Grounded AI Assistants",
    template: "%s · KSTM",
  },
  icons: {
    icon: "/cog.ico",
  },
  description:
    "Deploy retrieval-grounded AI assistants over PDF, CSV, JSON, TXT, and live web documentation in minutes.",
  openGraph: {
    title: "KSTM — Knowledge-Grounded AI Assistants",
    description:
      "Deploy retrieval-grounded AI assistants over PDF, CSV, JSON, TXT, and live web documentation in minutes.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: Cog.src,
        width: 1784,
        height: 892,
        alt: "KSTM Platform Preview",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={clsx("relative", dmSans.variable, jetbrainsMono.variable)}>
      <head>
        <link rel="icon" href="/img/favicon.ico" sizes="any" />
      </head>
      <body
        className={clsx(
          dmSans.className,
          "antialiased bg-zinc-50 text-zinc-900 selection:bg-zinc-900 selection:text-white"
        )}
      >
        {children}
      </body>
    </html>
  );
}

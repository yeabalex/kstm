import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import clsx from "clsx";
import Header from "@/components/dashboard/navbar/Navbar";
import Sidebar, { MenuItem } from "@/components/dashboard/sidebar/Sidebar";
import AuthWrapper from "@/components/AuthWrapper";


const dmSans = DM_Sans({ subsets: ["latin"] });
export const metadata: Metadata = {
  title: "Chat",
};

// Viewport configuration
export const viewport: Viewport = {
  themeColor: "#93A5E5", // Theme color for the website
};

const menuItems: MenuItem[] = [
  {
    title: 'Home',
    path: '/dashboard',
    icon: null
  },
  {
    title: 'Integration',
    path: '/integration',
    icon: null
  },
  {
    title: 'Chat',
    path: '/chat',
    icon: null
  },
  {
    title: 'Saved Bots',
    path: '/saved-bots',
    icon: null
  },
  {
    title: 'Marketplace',
    path: '/marketplace',
    icon: null
  },
];

const accountItems: MenuItem[] = [
  {
    title: 'Account',
    path: '/account',
    icon: null
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: null,
  },
];
export default function DashLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="relative">
      <head>
        <link rel="icon" href="/img/favicon.ico" sizes="any" />
      </head>
      <body className={clsx(dmSans.className, "antialiased bg-[#EAEEFE]")}>
              {children}
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import clsx from "clsx";
import Header from "@/components/dashboard/navbar/Navbar";
import Sidebar, { MenuItem } from "@/components/dashboard/sidebar/Sidebar";
import AuthWrapper from "@/components/AuthWrapper";
import { HomeIcon } from "lucide-react";
import { BookmarkIcon, ChatBubbleLeftIcon, Cog6ToothIcon, PuzzlePieceIcon, ShoppingBagIcon, UserIcon } from "@heroicons/react/24/outline";
import {Toaster} from 'react-hot-toast'

const dmSans = DM_Sans({ subsets: ["latin"] });
export const metadata: Metadata = {
  title: "Dashboard",
};

// Viewport configuration
export const viewport: Viewport = {
  themeColor: "#93A5E5", // Theme color for the website
};
const menuItems: MenuItem[] = [
  {
    title: 'Home',
    path: '/dashboard',
    icon: <HomeIcon className="w-5 h-5" />,
  },
  {
    title: 'Integration',
    path: '/integration',
    icon: <PuzzlePieceIcon className="w-5 h-5" />,
  },
  {
    title: 'Chat',
    path: '/chat',
    icon: <ChatBubbleLeftIcon className="w-5 h-5" />,
  },
  {
    title: 'Saved Bots',
    path: '/saved-bots',
    icon: <BookmarkIcon className="w-5 h-5" />,
  },
  {
    title: 'Marketplace',
    path: '/marketplace',
    icon: <ShoppingBagIcon className="w-5 h-5" />,
  },
];

const accountItems: MenuItem[] = [
  {
    title: 'Account',
    path: '/account',
    icon: <UserIcon className="w-5 h-5" />,
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: <Cog6ToothIcon className="w-5 h-5" />,
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
        <AuthWrapper>
          <Toaster position="bottom-center"/>
        <div className="flex h-screen">
          <Sidebar accountItems={accountItems} menuItems={menuItems} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
        </AuthWrapper>
      </body>
    </html>
  );
}

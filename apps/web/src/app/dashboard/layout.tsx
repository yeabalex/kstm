import type { Metadata } from "next";
import Header from "@/components/dashboard/navbar/Navbar";
import Sidebar, { MenuItem } from "@/components/dashboard/sidebar/Sidebar";
import AuthWrapper from "@/components/AuthWrapper";
import { HomeIcon, PlusCircleIcon, LayersIcon } from "lucide-react";
import {
  BookmarkIcon,
  Cog6ToothIcon,
  PuzzlePieceIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Workspace",
};

const menuItems: MenuItem[] = [
  {
    title: "Assistants",
    path: "/dashboard",
    icon: <HomeIcon className="w-4 h-4" />,
  },
  {
    title: "New Assistant",
    path: "/dashboard/create",
    icon: <PlusCircleIcon className="w-4 h-4" />,
  },
  {
    title: "Use Cases",
    path: "/usecases",
    icon: <LayersIcon className="w-4 h-4" />,
  },
  {
    title: "Integrations",
    path: "/integration",
    icon: <PuzzlePieceIcon className="w-4 h-4" />,
  },
  {
    title: "Saved Bots",
    path: "/saved-bots",
    icon: <BookmarkIcon className="w-4 h-4" />,
  },
];

const accountItems: MenuItem[] = [
  {
    title: "Account",
    path: "/account",
    icon: <UserIcon className="w-4 h-4" />,
  },
  {
    title: "Settings",
    path: "/settings",
    icon: <Cog6ToothIcon className="w-4 h-4" />,
  },
];

export default function DashLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthWrapper>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className:
            "!bg-zinc-900 !text-white !text-xs !font-medium !rounded-lg !px-3.5 !py-2.5 !shadow-lg",
        }}
      />
      <div className="flex h-screen bg-zinc-50 text-zinc-900">
        <Sidebar accountItems={accountItems} menuItems={menuItems} />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Header />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </AuthWrapper>
  );
}

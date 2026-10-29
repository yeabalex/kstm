import React from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Plus } from "lucide-react";
import { NavbarActions } from "./NavbarActions";
import Link from "next/link";

const Header: React.FC = () => {
  return (
    <header className="h-14 w-full px-6 bg-white border-b border-zinc-200/80 flex items-center justify-between gap-4 shrink-0">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md pl-10 lg:pl-0">
        <div className="flex items-center px-3 py-1.5 bg-zinc-50 border border-zinc-200/90 rounded-lg focus-within:border-zinc-400 focus-within:bg-white transition-colors">
          <MagnifyingGlassIcon className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search assistants..."
            className="w-full bg-transparent border-none focus:outline-none text-xs text-zinc-900 placeholder:text-zinc-400"
          />
          <kbd className="hidden sm:inline-block text-[10px] font-mono text-zinc-400 border border-zinc-200 rounded px-1.5 py-0.5 bg-white">
            /
          </kbd>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/create"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors text-xs font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Assistant</span>
        </Link>
        <NavbarActions />
      </div>
    </header>
  );
};

export default Header;

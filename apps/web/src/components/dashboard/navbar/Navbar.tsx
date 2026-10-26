import React from "react";
import Image from "next/image";
import {
  MagnifyingGlassIcon,
  BellIcon,
  SparklesIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { NavbarActions } from "./NavbarActions";
import Link from "next/link";

const Header: React.FC = () => {
  return (
    <div className="flex items-center justify-center gap-32 max-w-7xl px-4 py-[10px] bg-white border-b border-gray-100">
      <div className="flex">
      </div>

      {/* Search Input */}

      <div className="relative flex-1 max-w-xl">
        <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search AIs"
            className="w-full bg-transparent border-none focus:outline-none text-sm"
          />
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center space-x-4 ml-4">
        {/* Create New Bot Button */}
        <Link href="/dashboard/create" className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
          <SparklesIcon className="w-5 h-5 mr-2" />
          <span className="text-sm font-medium">Create New Bot</span>
        </Link>
        <NavbarActions />
      </div>
    </div>
  );
};

export default Header;

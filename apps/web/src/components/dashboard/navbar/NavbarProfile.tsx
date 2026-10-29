'use client';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export const NavbarProfile = () => {
  const { userId, email } = useAuth();
  const router = useRouter();
  const initials = email ? email.slice(0, 2).toUpperCase() : "KS";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-8 w-8 rounded-full p-0 border border-zinc-200 hover:border-zinc-300"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-zinc-100 text-zinc-800 text-xs font-mono font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 border-zinc-200" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-xs font-medium text-zinc-900 truncate">
              {email || "Workspace User"}
            </p>
            <p className="text-[11px] font-mono text-zinc-400 truncate">
              {userId}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push("/dashboard")}
          className="text-xs cursor-pointer"
        >
          <User className="mr-2 h-3.5 w-3.5 text-zinc-500" />
          <span>Workspace</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push("/dashboard/create")}
          className="text-xs cursor-pointer"
        >
          <Settings className="mr-2 h-3.5 w-3.5 text-zinc-500" />
          <span>New Assistant</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push("/login")}
          className="text-xs text-red-600 cursor-pointer"
        >
          <LogOut className="mr-2 h-3.5 w-3.5" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
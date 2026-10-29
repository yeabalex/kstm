import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const notifications = [
  {
    id: 1,
    title: "Worker queue active",
    description: "BullMQ kb-ingestion pipeline is connected and ready.",
    timestamp: "Active",
    read: false,
  },
  {
    id: 2,
    title: "Neo4j vector store",
    description: "Scoped knowledge base indexing enabled for PDF, CSV, JSON, TXT, and URLs.",
    timestamp: "System",
    read: true,
  },
];

export function NotificationsList() {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 rounded-lg border border-zinc-200 hover:bg-zinc-100"
        >
          <Bell className="h-4 w-4 text-zinc-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-emerald-500 rounded-full" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 border-zinc-200" align="end">
        <DropdownMenuLabel className="text-xs font-medium text-zinc-900 flex items-center justify-between">
          <span>System Status</span>
          <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
            ONLINE
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[180px]">
          {notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="flex flex-col items-start gap-1 p-3 focus:bg-zinc-50"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-medium text-zinc-900">
                  {notification.title}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  {notification.timestamp}
                </span>
              </div>
              <div className="text-xs text-zinc-500 leading-relaxed">
                {notification.description}
              </div>
            </DropdownMenuItem>
          ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
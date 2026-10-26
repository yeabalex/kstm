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

// In a real app, this would come from an API
const notifications = [
  {
    id: 1,
    title: "New AI Model Available",
    description: "GPT-4 Turbo is now available for integration",
    timestamp: "2 minutes ago",
    read: false,
  },
  {
    id: 2,
    title: "Training Complete",
    description: "Your custom model training has completed",
    timestamp: "1 hour ago",
    read: false,
  },
  {
    id: 3,
    title: "System Update",
    description: "Platform maintenance scheduled for tonight",
    timestamp: "2 hours ago",
    read: true,
  },
];

export function NotificationsList() {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-600 rounded-full" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="text-center">Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={`flex flex-col items-start gap-1 p-3 ${
                !notification.read
                  ? "bg-gradient-to-r from-white to-[#F1F0FB] border-l-2 border-[#9b87f5]"
                  : ""
              }`}
            >
              <div className="font-semibold">{notification.title}</div>
              <div className="text-sm text-muted-foreground">
                {notification.description}
              </div>
              <div className="text-xs text-muted-foreground">
                {notification.timestamp}
              </div>
            </DropdownMenuItem>
          ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
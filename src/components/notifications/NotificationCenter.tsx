import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: number;
  message: string;
  type: "LEAVE_REQUEST" | "LEAVE_APPROVAL" | "LEAVE_REJECTION" | "SYSTEM";
  read: boolean;
  createdAt: string;
}

export const NotificationCenter = () => {
  const mockNotification: Notification = {
    id: 1,
    message: "This is a placeholder notification",
    type: "SYSTEM",
    read: false,
    createdAt: new Date().toISOString()
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative">
          <Bell className="h-5 w-5" />
          <Badge 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center bg-red-500"
            variant="destructive"
          >
            1
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          <Button variant="ghost" size="sm">
            Mark all as read
          </Button>
        </div>
        <ScrollArea className="h-[400px]">
          <div className="space-y-1">
            <div className="p-4 hover:bg-gray-50 border-l-4 border-gray-500">
              <p className="text-sm">{mockNotification.message}</p>
              <span className="text-xs text-gray-500">
                Just now
              </span>
            </div>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

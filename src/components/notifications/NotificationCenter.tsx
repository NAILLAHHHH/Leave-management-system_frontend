import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import axios from "axios";

interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  readAt: string | null;
}

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(notification => !notification.read).length;

  // Fetch notifications when component mounts or when popover opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/notifications');
      setNotifications(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load notifications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      const promises = notifications
        .filter(notification => !notification.read)
        .map(notification => 
          axios.post(`/api/notifications/${notification.id}/read`)
        );
      
      await Promise.all(promises);
      
      // Refresh notifications after marking all as read
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notifications as read', err);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const response = await axios.post(`/api/notifications/${id}/read`);
      
      if (response.status === 200) {
        // Update the local state instead of refetching
        setNotifications(prevNotifications => 
          prevNotifications.map(notification => 
            notification.id === id 
              ? { ...notification, read: true, readAt: new Date().toISOString() } 
              : notification
          )
        );
      }
    } catch (err) {
      console.error(`Failed to mark notification ${id} as read`, err);
    }
  };

  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (err) {
      return 'Unknown time';
    }
  };

  return (
    <Popover onOpenChange={setIsOpen} open={isOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center bg-red-500"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex justify-center items-center h-20">
              <p className="text-sm text-gray-500">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-20">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex justify-center items-center h-20">
              <p className="text-sm text-gray-500">No notifications</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 border-l-4 cursor-pointer ${
                    notification.read ? 'border-gray-200 bg-gray-50' : 'border-blue-500'
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  {notification.title && (
                    <h5 className="font-medium text-sm">{notification.title}</h5>
                  )}
                  <p className="text-sm">{notification.message}</p>
                  <span className="text-xs text-gray-500">
                    {getTimeAgo(notification.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

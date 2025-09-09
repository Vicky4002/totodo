import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  BellRing, 
  CheckCircle2, 
  Clock, 
  X,
  Settings,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { tasks } = useTasks();
  const { toast } = useToast();

  // Generate notifications based on tasks
  useEffect(() => {
    const generateNotifications = () => {
      const newNotifications: Notification[] = [];

      // Overdue tasks
      const overdueTasks = tasks.filter(task => {
        if (!task.due_date || task.completed) return false;
        return new Date(task.due_date) < new Date();
      });

      if (overdueTasks.length > 0) {
        newNotifications.push({
          id: 'overdue-tasks',
          type: 'warning',
          title: 'Overdue Tasks',
          message: `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`,
          timestamp: new Date(),
          read: false,
        });
      }

      // Due today
      const dueTodayTasks = tasks.filter(task => {
        if (!task.due_date || task.completed) return false;
        const today = new Date();
        const dueDate = new Date(task.due_date);
        return dueDate.toDateString() === today.toDateString();
      });

      if (dueTodayTasks.length > 0) {
        newNotifications.push({
          id: 'due-today',
          type: 'info',
          title: 'Tasks Due Today',
          message: `${dueTodayTasks.length} task${dueTodayTasks.length > 1 ? 's' : ''} due today`,
          timestamp: new Date(),
          read: false,
        });
      }

      // High priority incomplete tasks
      const highPriorityTasks = tasks.filter(task => 
        task.priority === 'high' && !task.completed
      );

      if (highPriorityTasks.length > 0) {
        newNotifications.push({
          id: 'high-priority',
          type: 'warning',
          title: 'High Priority Tasks',
          message: `${highPriorityTasks.length} high priority task${highPriorityTasks.length > 1 ? 's' : ''} pending`,
          timestamp: new Date(),
          read: false,
        });
      }

      // Recently completed tasks
      const recentlyCompleted = tasks.filter(task => {
        if (!task.completed) return false;
        const dayAgo = new Date();
        dayAgo.setDate(dayAgo.getDate() - 1);
        return new Date(task.updated_at) > dayAgo;
      });

      if (recentlyCompleted.length > 0) {
        newNotifications.push({
          id: 'completed-recent',
          type: 'success',
          title: 'Tasks Completed',
          message: `Great job! ${recentlyCompleted.length} task${recentlyCompleted.length > 1 ? 's' : ''} completed recently`,
          timestamp: new Date(),
          read: false,
        });
      }

      setNotifications(newNotifications);
    };

    generateNotifications();
  }, [tasks]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed right-4 top-4 bottom-4 w-full max-w-md">
        <Card className="h-full flex flex-col shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Stay updated with your tasks</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 p-0">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-foreground mb-2">No notifications</h3>
                <p className="text-sm text-muted-foreground">
                  You're all caught up! Check back later for updates.
                </p>
              </div>
            ) : (
              <>
                {unreadCount > 0 && (
                  <div className="p-4 border-b">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={markAllAsRead}
                      className="w-full"
                    >
                      Mark all as read
                    </Button>
                  </div>
                )}
                
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-4">
                    {notifications.map((notification, index) => (
                      <div key={notification.id}>
                        <div
                          className={`p-4 rounded-lg border transition-all cursor-pointer hover:bg-accent/50 ${
                            notification.read ? 'opacity-60' : 'bg-accent/20'
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1">
                              {getNotificationIcon(notification.type)}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm text-foreground mb-1">
                                  {notification.title}
                                </h4>
                                <p className="text-xs text-muted-foreground mb-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {notification.timestamp.toLocaleTimeString([], { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </span>
                                  {!notification.read && (
                                    <div className="w-2 h-2 bg-primary rounded-full" />
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          {notification.action && (
                            <div className="mt-3 pt-3 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  notification.action?.onClick();
                                }}
                                className="w-full"
                              >
                                {notification.action.label}
                              </Button>
                            </div>
                          )}
                        </div>
                        {index < notifications.length - 1 && <Separator className="my-2" />}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
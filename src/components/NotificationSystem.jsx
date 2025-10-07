import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Bell, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const checkTaskDueDates = async () => {
    if (!user) return;

    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)
        .not('due_date', 'is', null);

      if (error) throw error;

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const newNotifications = [];

      tasks.forEach((task) => {
        if (!task.due_date) return;

        const dueDate = task.due_date;
        const isOverdue = dueDate < today;
        const isDueToday = dueDate === today;
        const isDueTomorrow = dueDate === tomorrow;

        if (isOverdue) {
          newNotifications.push({
            id: `overdue-${task.id}`,
            type: 'overdue',
            task,
            message: `Task "${task.title}" is overdue!`
          });
        } else if (isDueToday) {
          newNotifications.push({
            id: `today-${task.id}`,
            type: 'due_today',
            task,
            message: `Task "${task.title}" is due today!`
          });
        } else if (isDueTomorrow && task.priority === 'high') {
          newNotifications.push({
            id: `soon-${task.id}`,
            type: 'due_soon',
            task,
            message: `High priority task "${task.title}" is due tomorrow!`
          });
        }
      });

      setNotifications(newNotifications);
      
      // Show toast notifications for new urgent items
      const urgentNotifications = newNotifications.filter(n => 
        n.type === 'overdue' || (n.type === 'due_today' && n.task.priority === 'high')
      );

      urgentNotifications.forEach(notification => {
        toast({
          title: notification.type === 'overdue' ? 'Overdue Task!' : 'Due Today!',
          description: notification.message,
          variant: notification.type === 'overdue' ? 'destructive' : 'default',
        });
      });

    } catch (error) {
      console.error('Error checking task due dates:', error);
    }
  };

  useEffect(() => {
    if (user) {
      // Check immediately
      checkTaskDueDates();
      
      // Set up periodic checking (every 5 minutes)
      const interval = setInterval(checkTaskDueDates, 5 * 60 * 1000);
      
      // Set up real-time subscription for task changes
      const channel = supabase
        .channel('task-notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tasks',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            console.log('Task updated, checking due dates...');
            checkTaskDueDates();
          }
        )
        .subscribe();

      return () => {
        clearInterval(interval);
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const dismissNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'due_today':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'due_soon':
        return <Bell className="h-4 w-4 text-primary" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationVariant = (type) => {
    switch (type) {
      case 'overdue':
        return 'destructive';
      case 'due_today':
        return 'secondary';
      case 'due_soon':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (!user || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      {!isVisible && notifications.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="relative"
        >
          <Bell className="h-4 w-4 mr-2" />
          Notifications
          <Badge variant="destructive" className="absolute -top-2 -right-2 px-1 min-w-[20px] h-5">
            {notifications.length}
          </Badge>
        </Button>
      )}

      {isVisible && (
        <Card className="w-80 max-h-96 overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Task Notifications
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
              >
                ×
              </Button>
            </div>
            <CardDescription>
              {notifications.length} pending notification{notifications.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="max-h-64 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {notification.task.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getNotificationVariant(notification.type)} className="text-xs">
                            {notification.type.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {notification.task.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissNotification(notification.id)}
                      className="h-6 w-6 p-0 hover:bg-background"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
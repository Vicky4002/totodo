import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, Clock, AlertTriangle } from 'lucide-react';
import { Task } from '@/components/TaskCard';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  dueSoonTasks: Task[];
  overdueTasks: Task[];
  onTaskClick?: (task: Task) => void;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  dueSoonTasks,
  overdueTasks,
  onTaskClick
}) => {
  const totalNotifications = dueSoonTasks.length + overdueTasks.length;

  if (totalNotifications === 0) return null;

  const formatDueDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    if (isTomorrow) {
      return 'Tomorrow';
    }
    
    return date.toLocaleDateString();
  };

  const getDaysOverdue = (dateStr: string) => {
    const dueDate = new Date(dateStr);
    const now = new Date();
    const diffTime = now.getTime() - dueDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative touch-target"
        >
          <Bell className="h-5 w-5" />
          {totalNotifications > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {totalNotifications > 9 ? '9+' : totalNotifications}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Task Notifications
          </h3>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {/* Overdue Tasks */}
            {overdueTasks.map(task => (
              <div
                key={`overdue-${task.id}`}
                className={cn(
                  "p-3 rounded-md border border-destructive/20 bg-destructive/5 cursor-pointer hover:bg-destructive/10 transition-colors",
                  onTaskClick && "cursor-pointer"
                )}
                onClick={() => onTaskClick?.(task)}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-destructive mb-1">
                      Overdue Task
                    </p>
                    <p className="text-sm text-foreground font-medium truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getDaysOverdue(task.dueDate!) === 0 
                        ? 'Due today' 
                        : `${getDaysOverdue(task.dueDate!)} day${getDaysOverdue(task.dueDate!) > 1 ? 's' : ''} overdue`
                      }
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Due Soon Tasks */}
            {dueSoonTasks.map(task => (
              <div
                key={`due-soon-${task.id}`}
                className={cn(
                  "p-3 rounded-md border border-warning/20 bg-warning-light cursor-pointer hover:bg-warning/20 transition-colors",
                  onTaskClick && "cursor-pointer"
                )}
                onClick={() => onTaskClick?.(task)}
              >
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-warning mb-1">
                      Due Soon
                    </p>
                    <p className="text-sm text-foreground font-medium truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Due {formatDueDate(task.dueDate!)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalNotifications === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
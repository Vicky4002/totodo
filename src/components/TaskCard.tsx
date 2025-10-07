import React, { memo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CalendarDays, Clock, MoreHorizontal, Flag, Edit2, Trash2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGesture } from '@/hooks/useGesture';

import { Task } from '@/hooks/useTasks';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  className?: string;
}

const priorityColors = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-warning-light text-warning border-warning/20',
  high: 'bg-destructive/10 text-destructive border-destructive/20'
};

const priorityIcons = {
  low: '!',
  medium: '!!',
  high: '!!!'
};

const TaskCard: React.FC<TaskCardProps> = memo(({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  className
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !task.completed;

  const handleToggleComplete = useCallback(() => {
    onToggleComplete(task.id);
  }, [task.id, onToggleComplete]);

  const handleEdit = useCallback(() => {
    onEdit(task);
  }, [task, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete(task.id);
  }, [task.id, onDelete]);

  const gestureProps = useGesture({
    onSwipeLeft: handleEdit,
    onSwipeRight: handleToggleComplete,
    onTap: handleEdit,
    onLongPress: () => {
      // Haptic feedback would go here in a native app
      setIsPressed(true);
      setTimeout(() => setIsPressed(false), 200);
    }
  });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsPressed(true);
    gestureProps.onTouchStart(e);
  }, [gestureProps]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    setIsPressed(false);
    setSwipeX(0);
    gestureProps.onTouchEnd(e);
  }, [gestureProps]);

  return (
    <Card 
      className={cn(
        "group transition-all duration-300 hover:shadow-card animate-slide-in cursor-pointer",
        "transform hover:scale-[1.02] active:scale-[0.98]",
        "border border-border/50 hover:border-primary/30",
        task.completed && "opacity-75 hover:opacity-90",
        isOverdue && "border-destructive/30 bg-destructive/5 animate-pulse",
        isPressed && "scale-[0.98]",
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={gestureProps.onTouchMove}
      style={{ transform: `translateX(${swipeX}px)` }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.completed}
            onCheckedChange={handleToggleComplete}
            className={cn(
              "mt-1 transition-all duration-200 hover:scale-110",
              "data-[state=checked]:bg-success data-[state=checked]:border-success",
              task.completed && "animate-task-complete"
            )}
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 
                className={cn(
                  "font-medium text-sm leading-tight transition-all duration-200",
                  task.completed && "line-through text-muted-foreground"
                )}
              >
                {task.title}
              </h3>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleEdit}
                  className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground transition-all duration-200"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="animate-fade-in">
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit2 className="h-3 w-3 mr-2" />
                      Edit Task
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleDelete}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete Task
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
              </div>
            </div>

            {task.description && (
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center flex-wrap gap-2">
              {/* Priority Badge */}
              <Badge
                variant="outline"
                className={cn("text-xs px-2 py-0.5", priorityColors[task.priority])}
              >
                <Flag className="h-2.5 w-2.5 mr-1" />
                {task.priority}
              </Badge>

              {/* Due Date */}
              {task.due_date && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs px-2 py-0.5",
                    isOverdue ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-muted text-muted-foreground"
                  )}
                >
                  <CalendarDays className="h-2.5 w-2.5 mr-1" />
                  {new Date(task.due_date).toLocaleDateString()}
                  {task.due_time && ` ${task.due_time}`}
                </Badge>
              )}

              {/* Time Spent */}
              {task.time_spent > 0 && (
                <Badge variant="outline" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
                  <Clock className="h-2.5 w-2.5 mr-1" />
                  {Math.floor(task.time_spent / 60)}h {task.time_spent % 60}m
                </Badge>
              )}

              {/* Project */}
              {task.project && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  {task.project}
                </Badge>
              )}

              {/* Tags */}
              {task.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs px-2 py-0.5 bg-accent/50"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

TaskCard.displayName = 'TaskCard';

export { TaskCard };
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, Clock, MoreHorizontal, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  project?: string;
  tags: string[];
  createdAt: string;
}

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

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  className
}) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

  return (
    <Card 
      className={cn(
        "group transition-all duration-200 hover:shadow-card animate-slide-in",
        task.completed && "opacity-75",
        isOverdue && "border-destructive/30 bg-destructive/5",
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.completed}
            onCheckedChange={() => onToggleComplete(task.id)}
            className="mt-1 data-[state=checked]:bg-success data-[state=checked]:border-success"
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
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => onEdit(task)}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
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
              {task.dueDate && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs px-2 py-0.5",
                    isOverdue ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-muted text-muted-foreground"
                  )}
                >
                  <CalendarDays className="h-2.5 w-2.5 mr-1" />
                  {new Date(task.dueDate).toLocaleDateString()}
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
};
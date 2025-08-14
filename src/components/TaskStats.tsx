import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Clock, AlertTriangle } from 'lucide-react';
import { Task } from './TaskCard';

interface TaskStatsProps {
  tasks: Task[];
}

export const TaskStats: React.FC<TaskStatsProps> = ({ tasks }) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const overdueTasks = tasks.filter(task => 
    task.due_date && 
    new Date(task.due_date) < new Date() && 
    !task.completed
  ).length;
  
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const stats = [
    {
      label: 'Total Tasks',
      value: totalTasks,
      icon: Circle,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/10'
    },
    {
      label: 'Completed',
      value: completedTasks,
      icon: CheckCircle2,
      color: 'text-success',
      bgColor: 'bg-success-light'
    },
    {
      label: 'Pending',
      value: pendingTasks,
      icon: Clock,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      label: 'Overdue',
      value: overdueTasks,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Progress Overview */}
      <Card className="bg-gradient-bg shadow-soft">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                Daily Progress
              </h3>
              <span className="text-2xl font-bold text-primary">
                {Math.round(completionRate)}%
              </span>
            </div>
            
            <Progress 
              value={completionRate} 
              className="h-3 bg-muted/30"
            />
            
            <p className="text-sm text-muted-foreground">
              {completedTasks} of {totalTasks} tasks completed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={stat.label}
              className="transition-all duration-200 hover:shadow-card animate-fade-in"
            >
              <CardContent className="p-4">
                <div className="flex items-center space-y-2">
                  <div className={`p-2 rounded-lg ${stat.bgColor} mb-2`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">
                      {stat.label}
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
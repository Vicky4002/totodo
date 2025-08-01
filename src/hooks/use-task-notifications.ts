import { useEffect, useRef } from 'react';
import { Task } from '@/components/TaskCard';
import { useToast } from '@/hooks/use-toast';

interface UseTaskNotificationsProps {
  tasks: Task[];
  enabled?: boolean;
}

export const useTaskNotifications = ({ tasks, enabled = true }: UseTaskNotificationsProps) => {
  const { toast } = useToast();
  const notifiedTasksRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const nearDueTasks = tasks.filter(task => {
      if (task.completed || !task.dueDate) return false;
      
      const dueDate = new Date(task.dueDate);
      const isNearDue = dueDate <= tomorrow && dueDate >= now;
      const wasNotified = notifiedTasksRef.current.has(task.id);
      
      return isNearDue && !wasNotified;
    });

    // Show notifications for near due tasks
    nearDueTasks.forEach(task => {
      const dueDate = new Date(task.dueDate!);
      const isToday = dueDate.toDateString() === now.toDateString();
      const isTomorrow = dueDate.toDateString() === tomorrow.toDateString();
      
      let description = '';
      if (isToday) {
        description = `Due today at ${dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } else if (isTomorrow) {
        description = 'Due tomorrow';
      } else {
        description = `Due ${dueDate.toLocaleDateString()}`;
      }

      toast({
        title: `⏰ Task Due Soon`,
        description: `"${task.title}" - ${description}`,
        duration: 8000,
      });

      // Mark as notified
      notifiedTasksRef.current.add(task.id);
    });

    // Check for overdue tasks
    const overdueTasks = tasks.filter(task => {
      if (task.completed || !task.dueDate) return false;
      
      const dueDate = new Date(task.dueDate);
      const isOverdue = dueDate < now;
      const wasNotified = notifiedTasksRef.current.has(`overdue-${task.id}`);
      
      return isOverdue && !wasNotified;
    });

    // Show notifications for overdue tasks
    overdueTasks.forEach(task => {
      const dueDate = new Date(task.dueDate!);
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      toast({
        title: `🚨 Task Overdue`,
        description: `"${task.title}" - ${daysOverdue === 0 ? 'Due today' : `${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`}`,
        variant: "destructive",
        duration: 10000,
      });

      // Mark as notified
      notifiedTasksRef.current.add(`overdue-${task.id}`);
    });

  }, [tasks, enabled, toast]);

  // Clean up notifications for completed or deleted tasks
  useEffect(() => {
    const currentTaskIds = new Set(tasks.map(task => task.id));
    const notifiedIds = Array.from(notifiedTasksRef.current);
    
    notifiedIds.forEach(id => {
      const taskId = id.replace('overdue-', '');
      if (!currentTaskIds.has(taskId)) {
        notifiedTasksRef.current.delete(id);
      }
    });

    // Remove notifications for completed tasks
    tasks.forEach(task => {
      if (task.completed) {
        notifiedTasksRef.current.delete(task.id);
        notifiedTasksRef.current.delete(`overdue-${task.id}`);
      }
    });
  }, [tasks]);

  const getDueSoonTasks = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    return tasks.filter(task => {
      if (task.completed || !task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate <= tomorrow && dueDate >= now;
    });
  };

  const getOverdueTasks = () => {
    const now = new Date();
    return tasks.filter(task => {
      if (task.completed || !task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate < now;
    });
  };

  return {
    dueSoonTasks: getDueSoonTasks(),
    overdueTasks: getOverdueTasks(),
    dueSoonCount: getDueSoonTasks().length,
    overdueCount: getOverdueTasks().length,
  };
};
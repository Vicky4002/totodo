import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Trophy, Sparkles } from 'lucide-react';

interface CompletedTask {
  id: string;
  title: string;
  priority: string;
  completed: boolean;
}

export const TaskCompletionNotification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time task completion notifications...');

    // Listen for task updates in real-time
    const channel = supabase
      .channel('task-completion-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Task update detected:', payload);
          
          const oldTask = payload.old as CompletedTask;
          const newTask = payload.new as CompletedTask;
          
          // Check if task was just completed
          if (!oldTask.completed && newTask.completed) {
            console.log('Task completed:', newTask.title);
            
            setCompletedCount(prev => prev + 1);
            
            // Show celebration notification
            const priorityEmoji = newTask.priority === 'high' ? '🔥' : 
                                 newTask.priority === 'medium' ? '⭐' : '✨';
            
            toast({
              title: `Task Completed! ${priorityEmoji}`,
              description: (
                <div className="space-y-2">
                  <p className="font-medium">{newTask.title}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Trophy className="h-4 w-4" />
                    <span>Great work! Keep up the momentum!</span>
                  </div>
                </div>
              ),
              duration: 5000,
            });

            // Play a subtle success sound (optional)
            try {
              const audio = new Audio('data:audio/wav;base64,UklGRhIAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==');
              audio.volume = 0.3;
              audio.play().catch(() => {
                // Silently fail if audio can't play
              });
            } catch (e) {
              // Ignore audio errors
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    // Show milestone notifications
    if (completedCount > 0 && completedCount % 5 === 0) {
      toast({
        title: "Milestone Achieved! ✨",
        description: `You've completed ${completedCount} tasks! Amazing progress! 🎉`,
        duration: 5000,
      });
    }

    return () => {
      console.log('Cleaning up real-time subscription...');
      supabase.removeChannel(channel);
    };
  }, [user, toast, completedCount]);

  return null; // This is a notification-only component with no UI
};

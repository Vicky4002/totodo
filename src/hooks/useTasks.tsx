import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LocalStorageService } from '@/utils/localStorageService';
import { useSyncManager } from '@/hooks/useSyncManager';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  due_time?: string;
  project?: string;
  tags: string[];
  time_spent?: number;
  created_at: string;
  updated_at: string;
}

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { 
    syncStatus, 
    addTaskWithSync, 
    updateTaskWithSync, 
    deleteTaskWithSync, 
    pullFromCloud,
    syncToCloud 
  } = useSyncManager();

  // Load tasks on mount and when user changes
  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      
      if (user) {
        // Load from local storage first for instant display
        const localTasks = LocalStorageService.getTasks();
        setTasks(localTasks);
        
        // Then sync with cloud if online
        if (navigator.onLine) {
          try {
            const cloudTasks = await pullFromCloud();
            setTasks(cloudTasks);
          } catch (error) {
            console.error('Error loading tasks from cloud:', error);
            // Keep local tasks if cloud fails
          }
        }
      } else {
        setTasks([]);
      }
      
      setLoading(false);
    };

    loadTasks();
  }, [user, pullFromCloud]);

  // Set up real-time subscription for cloud updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time task update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newTask = { ...payload.new, priority: payload.new.priority as 'low' | 'medium' | 'high' } as Task;
            setTasks(prev => {
              const exists = prev.find(t => t.id === newTask.id);
              if (!exists) {
                const updated = [...prev, newTask];
                LocalStorageService.saveTasks(updated);
                return updated;
              }
              return prev;
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedTask = { ...payload.new, priority: payload.new.priority as 'low' | 'medium' | 'high' } as Task;
            setTasks(prev => {
              const updated = prev.map(t => t.id === updatedTask.id ? updatedTask : t);
              LocalStorageService.saveTasks(updated);
              return updated;
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedTask = payload.old as Task;
            setTasks(prev => {
              const updated = prev.filter(t => t.id !== deletedTask.id);
              LocalStorageService.saveTasks(updated);
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const addTask = async (newTask: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    const task = await addTaskWithSync(newTask);
    
    setTasks(prev => {
      const updated = [task, ...prev];
      return updated;
    });
    
    return task;
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    await updateTaskWithSync(id, updates);
    
    setTasks(prev => {
      const updated = prev.map(task => 
        task.id === id ? { ...task, ...updates, updated_at: new Date().toISOString() } : task
      );
      return updated;
    });
  };

  const toggleTaskComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      const updates = { completed: !task.completed };
      await updateTask(id, updates);
    }
  };

  const deleteTask = async (id: string) => {
    await deleteTaskWithSync(id);
    
    setTasks(prev => {
      const updated = prev.filter(task => task.id !== id);
      return updated;
    });
  };

  return {
    tasks,
    loading,
    syncStatus,
    addTask,
    updateTask,
    toggleTaskComplete,
    deleteTask,
    syncToCloud,
    refetch: async () => {
      const cloudTasks = await pullFromCloud();
      setTasks(cloudTasks);
    }
  };
};

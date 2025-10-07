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
  const [tasks, setTasks] = useState([]);
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

  // Load tasks on mount and when user changes - ALWAYS work offline first
  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      
      // ALWAYS load from local storage first - app works offline-first
      const localTasks = LocalStorageService.getTasks();
      setTasks(localTasks);
      
      if (user) {
        // Only attempt cloud sync if explicitly online and user is authenticated
        if (navigator.onLine) {
          try {
            const cloudTasks = await pullFromCloud();
            // Only update if cloud has newer data
            if (cloudTasks.length >= localTasks.length) {
              setTasks(cloudTasks);
            }
          } catch (error) {
            console.error('Cloud sync failed, continuing offline:', error);
            // App continues to work with local data
          }
        }
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

  const updateTask = async (id, updates) => {
    await updateTaskWithSync(id, updates);
    
    setTasks(prev => {
      const updated = prev.map(task => 
        task.id === id ? { ...task, ...updates, updated_at: new Date().toISOString() } : task
      );
      return updated;
    });
  };

  const toggleTaskComplete = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      const updates = { completed: !task.completed };
      await updateTask(id, updates);
    }
  };

  const deleteTask = async (id) => {
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

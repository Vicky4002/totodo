import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LocalStorageService, PendingChange } from '@/utils/localStorageService';
import { Task } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export const useSyncManager = () => {
  const [syncStatus, setSyncStatus] = useState({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSync: LocalStorageService.getLastSync(),
    pendingChanges: LocalStorageService.getPendingChanges().length,
    hasConflicts: false
  });

  const { toast } = useToast();
  const { user } = useAuth();

  // Update online status
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      if (user) {
        syncToCloud();
      }
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  // Sync local changes to cloud
  const syncToCloud = useCallback(async (): Promise<boolean> => {
    if (!user || !navigator.onLine) {
      return false;
    }

    setSyncStatus(prev => ({ ...prev, isSyncing: true }));

    try {
      const pendingChanges = LocalStorageService.getPendingChanges();
      
      if (pendingChanges.length === 0) {
        // Pull latest data from cloud
        await pullFromCloud();
        setSyncStatus(prev => ({ 
          ...prev, 
          isSyncing: false, 
          lastSync: Date.now()
        }));
        LocalStorageService.setLastSync(Date.now());
        return true;
      }

      // Process pending changes
      for (const change of pendingChanges) {
        try {
          switch (change.type) {
            case 'create':
              if (change.task) {
                const { error } = await supabase
                  .from('tasks')
                  .insert([{ ...change.task, user_id: user.id }]);
                
                if (!error) {
                  LocalStorageService.removePendingChange(change.id);
                }
              }
              break;

            case 'update':
              if (change.task) {
                const { error } = await supabase
                  .from('tasks')
                  .update(change.task)
                  .eq('id', change.task.id)
                  .eq('user_id', user.id);
                
                if (!error) {
                  LocalStorageService.removePendingChange(change.id);
                }
              }
              break;

            case 'delete':
              const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', change.id)
                .eq('user_id', user.id);
              
              if (!error) {
                LocalStorageService.removePendingChange(change.id);
              }
              break;
          }
        } catch (error) {
          console.error('Error processing change:', change, error);
        }
      }

      // Pull latest data after pushing changes
      await pullFromCloud();
      
      const remainingChanges = LocalStorageService.getPendingChanges().length;
      setSyncStatus(prev => ({ 
        ...prev, 
        isSyncing: false, 
        lastSync: Date.now(),
        pendingChanges: remainingChanges
      }));
      
      LocalStorageService.setLastSync(Date.now());

      if (remainingChanges === 0) {
        toast({
          title: "Sync Complete",
          description: "All tasks synchronized successfully",
        });
      }

      return true;

    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
      
      toast({
        title: "Sync Failed",
        description: "Unable to sync tasks. Will retry automatically.",
        variant: "destructive",
      });

      return false;
    }
  }, [user, toast]);

  // Pull data from cloud to local
  const pullFromCloud = useCallback(async (): Promise<Task[]> => {
    if (!user) return [];

    try {
      const { data: cloudTasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const tasks = (cloudTasks || []).map(task => ({
        ...task,
        priority: task.priority as 'low' | 'medium' | 'high'
      })) as Task[];
      
      LocalStorageService.saveTasks(tasks);
      
      return tasks;

    } catch (error) {
      console.error('Error pulling from cloud:', error);
      return LocalStorageService.getTasks();
    }
  }, [user]);

  // Add task with sync
  const addTaskWithSync = useCallback(async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save locally first
    LocalStorageService.addTask(newTask);

    if (navigator.onLine && user) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .insert([{ ...newTask, user_id: user.id }])
          .select()
          .single();

        if (error) throw error;

        // Update local storage with server-generated data
        const serverTask = { ...data, priority: data.priority as 'low' | 'medium' | 'high' } as Task;
        LocalStorageService.updateTask(newTask.id, serverTask);
        return serverTask;

      } catch (error) {
        console.error('Error adding task to cloud:', error);
        
        // Add to pending changes for later sync
        LocalStorageService.addPendingChange({
          id: crypto.randomUUID(),
          type: 'create',
          task: newTask,
          timestamp: Date.now()
        });

        setSyncStatus(prev => ({ 
          ...prev, 
          pendingChanges: prev.pendingChanges + 1 
        }));

        toast({
          title: "Offline Mode",
          description: "Task saved locally. Will sync when online.",
        });
      }
    } else {
      // Offline - add to pending changes
      LocalStorageService.addPendingChange({
        id: crypto.randomUUID(),
        type: 'create',
        task: newTask,
        timestamp: Date.now()
      });

      setSyncStatus(prev => ({ 
        ...prev, 
        pendingChanges: prev.pendingChanges + 1 
      }));
    }

    return newTask;
  }, [user, toast]);

  // Update task with sync
  const updateTaskWithSync = useCallback(async (taskId, updates) => {
    const updatedTask = { ...updates, updated_at: new Date().toISOString() };

    // Update locally first
    LocalStorageService.updateTask(taskId, updatedTask);

    if (navigator.onLine && user) {
      try {
        const { error } = await supabase
          .from('tasks')
          .update(updatedTask)
          .eq('id', taskId)
          .eq('user_id', user.id);

        if (error) throw error;

      } catch (error) {
        console.error('Error updating task in cloud:', error);
        
        // Add to pending changes
        const localTasks = LocalStorageService.getTasks();
        const task = localTasks.find(t => t.id === taskId);
        
        if (task) {
          LocalStorageService.addPendingChange({
            id: crypto.randomUUID(),
            type: 'update',
            task,
            timestamp: Date.now()
          });

          setSyncStatus(prev => ({ 
            ...prev, 
            pendingChanges: prev.pendingChanges + 1 
          }));
        }
      }
    } else {
      // Offline - add to pending changes
      const localTasks = LocalStorageService.getTasks();
      const task = localTasks.find(t => t.id === taskId);
      
      if (task) {
        LocalStorageService.addPendingChange({
          id: crypto.randomUUID(),
          type: 'update',
          task,
          timestamp: Date.now()
        });

        setSyncStatus(prev => ({ 
          ...prev, 
          pendingChanges: prev.pendingChanges + 1 
        }));
      }
    }
  }, [user]);

  // Delete task with sync
  const deleteTaskWithSync = useCallback(async (taskId) => {
    // Delete locally first
    LocalStorageService.deleteTask(taskId);

    if (navigator.onLine && user) {
      try {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', taskId)
          .eq('user_id', user.id);

        if (error) throw error;

      } catch (error) {
        console.error('Error deleting task from cloud:', error);
        
        // Add to pending changes
        LocalStorageService.addPendingChange({
          id: taskId,
          type: 'delete',
          timestamp: Date.now()
        });

        setSyncStatus(prev => ({ 
          ...prev, 
          pendingChanges: prev.pendingChanges + 1 
        }));
      }
    } else {
      // Offline - add to pending changes
      LocalStorageService.addPendingChange({
        id: taskId,
        type: 'delete',
        timestamp: Date.now()
      });

      setSyncStatus(prev => ({ 
        ...prev, 
        pendingChanges: prev.pendingChanges + 1 
      }));
    }
  }, [user]);

  // Force sync
  const forcSync = useCallback(async (): Promise<boolean> => {
    return await syncToCloud();
  }, [syncToCloud]);

  // Clear local data
  const clearLocalData = useCallback(() => {
    LocalStorageService.clearAll();
    setSyncStatus({
      isOnline: navigator.onLine,
      isSyncing: false,
      lastSync: 0,
      pendingChanges: 0,
      hasConflicts: false
    });
  }, []);

  return {
    syncStatus,
    syncToCloud,
    pullFromCloud,
    addTaskWithSync,
    updateTaskWithSync,
    deleteTaskWithSync,
    forcSync,
    clearLocalData
  };
};
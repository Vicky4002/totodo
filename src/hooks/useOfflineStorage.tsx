import { useState, useEffect, useCallback } from 'react';
import { LocalStorageService } from '@/utils/localStorageService';
import { Task } from '@/hooks/useTasks';

export interface OfflineCapabilities {
  isOnline: boolean;
  storageQuota: { used: number; available: number; percentage: number };
  hasData: boolean;
  canWorkOffline: boolean;
}

export const useOfflineStorage = () => {
  const [capabilities, setCapabilities] = useState<OfflineCapabilities>({
    isOnline: navigator.onLine,
    storageQuota: { used: 0, available: 0, percentage: 0 },
    hasData: false,
    canWorkOffline: false
  });

  const updateCapabilities = useCallback(() => {
    const storageInfo = LocalStorageService.getStorageInfo();
    const tasks = LocalStorageService.getTasks();
    
    setCapabilities({
      isOnline: navigator.onLine,
      storageQuota: storageInfo,
      hasData: tasks.length > 0,
      canWorkOffline: true // App is designed to work fully offline
    });
  }, []);

  useEffect(() => {
    updateCapabilities();

    const handleOnline = () => updateCapabilities();
    const handleOffline = () => updateCapabilities();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update capabilities every 30 seconds
    const interval = setInterval(updateCapabilities, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [updateCapabilities]);

  // Force app to work offline - all operations use local storage first
  const workOffline = useCallback(() => {
    // Disable network requests by overriding fetch (for this session only)
    if (typeof window !== 'undefined') {
      const originalFetch = window.fetch;
      window.fetch = () => Promise.reject(new Error('App running in offline-only mode'));
      
      // Restore fetch after 5 minutes (optional safety measure)
      setTimeout(() => {
        window.fetch = originalFetch;
      }, 5 * 60 * 1000);
    }
  }, []);

  const exportData = useCallback(() => {
    const tasks = LocalStorageService.getTasks();
    const pendingChanges = LocalStorageService.getPendingChanges();
    const lastSync = LocalStorageService.getLastSync();

    const exportData = {
      tasks,
      pendingChanges,
      lastSync,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `totodo-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const importData = useCallback((file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          
          if (data.tasks && Array.isArray(data.tasks)) {
            // Merge with existing tasks (avoid duplicates)
            const existingTasks = LocalStorageService.getTasks();
            const existingIds = new Set(existingTasks.map(t => t.id));
            
            const newTasks = data.tasks.filter((task: Task) => !existingIds.has(task.id));
            const allTasks = [...existingTasks, ...newTasks];
            
            LocalStorageService.saveTasks(allTasks);
            updateCapabilities();
            resolve();
          } else {
            reject(new Error('Invalid backup file format'));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, [updateCapabilities]);

  return {
    capabilities,
    updateCapabilities,
    workOffline,
    exportData,
    importData
  };
};
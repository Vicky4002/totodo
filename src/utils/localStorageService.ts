import { Task } from '@/hooks/useTasks';

const TASKS_KEY = 'totodo_tasks';
const LAST_SYNC_KEY = 'totodo_last_sync';
const PENDING_CHANGES_KEY = 'totodo_pending_changes';

export interface PendingChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  task?: Task;
  timestamp: number;
}

export class LocalStorageService {
  // Get all tasks from local storage
  static getTasks(): Task[] {
    try {
      const tasks = localStorage.getItem(TASKS_KEY);
      return tasks ? JSON.parse(tasks) : [];
    } catch (error) {
      console.error('Error reading tasks from localStorage:', error);
      return [];
    }
  }

  // Save tasks to local storage
  static saveTasks(tasks: Task[]): void {
    try {
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks to localStorage:', error);
    }
  }

  // Add a single task to local storage
  static addTask(task: Task): void {
    const tasks = this.getTasks();
    tasks.push(task);
    this.saveTasks(tasks);
  }

  // Update a task in local storage
  static updateTask(taskId: string, updatedTask: Partial<Task>): void {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updatedTask };
      this.saveTasks(tasks);
    }
  }

  // Delete a task from local storage
  static deleteTask(taskId: string): void {
    const tasks = this.getTasks();
    const filteredTasks = tasks.filter(t => t.id !== taskId);
    this.saveTasks(filteredTasks);
  }

  // Get last sync timestamp
  static getLastSync(): number {
    try {
      const lastSync = localStorage.getItem(LAST_SYNC_KEY);
      return lastSync ? parseInt(lastSync) : 0;
    } catch {
      return 0;
    }
  }

  // Set last sync timestamp
  static setLastSync(timestamp: number): void {
    try {
      localStorage.setItem(LAST_SYNC_KEY, timestamp.toString());
    } catch (error) {
      console.error('Error saving last sync timestamp:', error);
    }
  }

  // Get pending changes
  static getPendingChanges(): PendingChange[] {
    try {
      const changes = localStorage.getItem(PENDING_CHANGES_KEY);
      return changes ? JSON.parse(changes) : [];
    } catch {
      return [];
    }
  }

  // Add pending change
  static addPendingChange(change: PendingChange): void {
    try {
      const changes = this.getPendingChanges();
      changes.push(change);
      localStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify(changes));
    } catch (error) {
      console.error('Error saving pending change:', error);
    }
  }

  // Clear pending changes
  static clearPendingChanges(): void {
    try {
      localStorage.removeItem(PENDING_CHANGES_KEY);
    } catch (error) {
      console.error('Error clearing pending changes:', error);
    }
  }

  // Remove specific pending change
  static removePendingChange(changeId: string): void {
    try {
      const changes = this.getPendingChanges();
      const filteredChanges = changes.filter(c => c.id !== changeId);
      localStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify(filteredChanges));
    } catch (error) {
      console.error('Error removing pending change:', error);
    }
  }

  // Clear all local data
  static clearAll(): void {
    try {
      localStorage.removeItem(TASKS_KEY);
      localStorage.removeItem(LAST_SYNC_KEY);
      localStorage.removeItem(PENDING_CHANGES_KEY);
    } catch (error) {
      console.error('Error clearing local storage:', error);
    }
  }

  // Get storage usage info
  static getStorageInfo(): { used: number; available: number; percentage: number } {
    try {
      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }

      // Most browsers have a 5-10MB localStorage limit
      const available = 10 * 1024 * 1024; // 10MB estimate
      const percentage = (used / available) * 100;

      return { used, available, percentage };
    } catch {
      return { used: 0, available: 0, percentage: 0 };
    }
  }
}
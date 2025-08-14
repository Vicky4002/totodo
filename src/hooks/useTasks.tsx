import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  project?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTasks = async () => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setTasks((data || []).map(task => ({
        ...task,
        priority: task.priority as 'low' | 'medium' | 'high'
      })));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching tasks",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const addTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          ...taskData,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      setTasks(prev => [{
        ...data,
        priority: data.priority as 'low' | 'medium' | 'high'
      }, ...prev]);
      toast({
        title: "Task added",
        description: "Your task has been created successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding task",
        description: error.message,
      });
    }
  };

  const toggleTaskComplete = async (taskId: string) => {
    if (!user) return;

    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const { error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating task",
        description: error.message,
      });
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, ...updates } : t
      ));

      toast({
        title: "Task updated",
        description: "Your task has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating task",
        description: error.message,
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast({
        title: "Task deleted",
        description: "Your task has been deleted successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting task",
        description: error.message,
      });
    }
  };

  return {
    tasks,
    loading,
    addTask,
    toggleTaskComplete,
    updateTask,
    deleteTask,
    refetch: fetchTasks
  };
};
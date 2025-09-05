-- Enable real-time updates for tasks and notifications tables
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Add tasks table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;

-- Add notifications table to realtime publication  
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
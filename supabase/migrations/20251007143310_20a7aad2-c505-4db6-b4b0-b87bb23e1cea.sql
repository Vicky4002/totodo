-- Ensure REPLICA IDENTITY FULL is set for tasks table (needed for real-time updates with full row data)
ALTER TABLE public.tasks REPLICA IDENTITY FULL;

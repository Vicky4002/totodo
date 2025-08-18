-- Fix the security warning by setting search_path for the function
DROP FUNCTION IF EXISTS public.schedule_task_notifications();

CREATE OR REPLACE FUNCTION public.schedule_task_notifications()
RETURNS void AS $$
DECLARE
    task_record RECORD;
    profile_record RECORD;
    notification_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Loop through tasks that are due within 24 hours and haven't been completed
    FOR task_record IN 
        SELECT t.*, p.display_name, p.mobile_number, u.email
        FROM public.tasks t
        JOIN auth.users u ON t.user_id = u.id
        LEFT JOIN public.profiles p ON t.user_id = p.user_id
        WHERE t.due_date IS NOT NULL
        AND t.completed = false
        AND t.due_date::date = (CURRENT_DATE + INTERVAL '1 day')::date
        AND NOT EXISTS (
            SELECT 1 FROM public.notifications n 
            WHERE n.task_id = t.id 
            AND n.type = 'email' 
            AND n.sent_at IS NOT NULL
            AND DATE(n.scheduled_for) = (CURRENT_DATE + INTERVAL '1 day')::date
        )
    LOOP
        -- Calculate notification time (send at 9 AM the day before due date)
        notification_time := (task_record.due_date::date - INTERVAL '1 day')::date + TIME '09:00:00';
        
        -- Only schedule if notification time is in the future
        IF notification_time > NOW() THEN
            -- Insert email notification
            INSERT INTO public.notifications (
                user_id, 
                task_id, 
                type, 
                scheduled_for, 
                message
            ) VALUES (
                task_record.user_id,
                task_record.id,
                'email',
                notification_time,
                'Task "' || task_record.title || '" is due tomorrow'
            ) ON CONFLICT DO NOTHING;

            -- Insert SMS notification if mobile number exists
            IF task_record.mobile_number IS NOT NULL AND task_record.mobile_number != '' THEN
                INSERT INTO public.notifications (
                    user_id, 
                    task_id, 
                    type, 
                    scheduled_for, 
                    message
                ) VALUES (
                    task_record.user_id,
                    task_record.id,
                    'sms',
                    notification_time,
                    'Task "' || task_record.title || '" is due tomorrow'
                ) ON CONFLICT DO NOTHING;
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
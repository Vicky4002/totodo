import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId } = await req.json();
    console.log('AI Assistant request:', { message, userId });

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get user's tasks and profile
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      throw new Error('Failed to fetch tasks');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    const userName = profile?.display_name || 'there';
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Prepare task context
    const taskContext = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      due_date: task.due_date,
      due_time: task.due_time,
      completed: task.completed,
      project: task.project,
      tags: task.tags
    }));

    const overdueTasks = tasks.filter(task => 
      !task.completed && task.due_date && task.due_date < currentDate
    );

    const todayTasks = tasks.filter(task => 
      !task.completed && task.due_date === currentDate
    );

    const upcomingTasks = tasks.filter(task => 
      !task.completed && task.due_date && task.due_date > currentDate
    ).slice(0, 5);

    const systemPrompt = `You are TaskBuddy, a helpful AI assistant for task management. You help users organize, track, and manage their tasks efficiently.

User Context:
- User name: ${userName}
- Current date: ${currentDate}
- Total tasks: ${tasks.length}
- Completed tasks: ${tasks.filter(t => t.completed).length}
- Pending tasks: ${tasks.filter(t => !t.completed).length}
- Overdue tasks: ${overdueTasks.length}
- Due today: ${todayTasks.length}

Current Tasks Overview:
${taskContext.length > 0 ? JSON.stringify(taskContext, null, 2) : 'No tasks found'}

Key capabilities:
1. Help create, update, and organize tasks
2. Provide task insights and reminders
3. Suggest productivity improvements
4. Answer questions about task management
5. Help prioritize work

Always be helpful, encouraging, and proactive in suggesting ways to improve productivity. When users ask about creating or updating tasks, explain that they can use the main task interface to make changes, but you can help them plan and organize their approach.

If there are overdue tasks, gently remind the user about them. If there are tasks due today, highlight them. Be supportive and motivating in your responses.`;

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI Assistant response generated successfully');

    return new Response(JSON.stringify({ 
      response: aiResponse,
      taskSummary: {
        total: tasks.length,
        completed: tasks.filter(t => t.completed).length,
        pending: tasks.filter(t => !t.completed).length,
        overdue: overdueTasks.length,
        dueToday: todayTasks.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI assistant:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
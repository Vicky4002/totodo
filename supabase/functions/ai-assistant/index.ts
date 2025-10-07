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

    const systemPrompt = `You are TaskBuddy, a helpful AI assistant for task management powered by Google Gemini. You help users organize, track, and manage their tasks efficiently.

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
1. Analyze tasks and provide intelligent insights
2. Suggest task prioritization and time management strategies
3. Identify patterns in task completion and productivity
4. Provide motivational support and reminders
5. Help break down complex tasks into manageable steps
6. Detect overdue tasks and suggest recovery strategies

Always be helpful, encouraging, and proactive. Provide actionable advice based on the user's task data. When users ask about creating or updating tasks, guide them on best practices but remind them to use the main interface for actual changes.

If there are overdue tasks, acknowledge them constructively and suggest a plan. If there are tasks due today, prioritize them. Be supportive, motivating, and use data-driven insights to help improve productivity.`;

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('Lovable API key not found');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Lovable AI error:', response.status, errorData);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (response.status === 402) {
        throw new Error('AI credits exhausted. Please add more credits to continue.');
      }
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
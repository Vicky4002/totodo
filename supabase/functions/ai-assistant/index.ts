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
    const { message, userId, conversationHistory = [] } = await req.json();
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

    const systemPrompt = `You are TaskBuddy, an intelligent AI assistant for task management powered by Google Gemini. You can CREATE tasks directly in the database.

User Context:
- User name: ${userName}
- Current date: ${currentDate}
- Total tasks: ${tasks.length}
- Completed tasks: ${tasks.filter(t => t.completed).length}
- Pending tasks: ${tasks.filter(t => !t.completed).length}
- Overdue tasks: ${overdueTasks.length}
- Due today: ${todayTasks.length}

Current Tasks:
${taskContext.length > 0 ? JSON.stringify(taskContext, null, 2) : 'No tasks found'}

You can CREATE TASKS directly using the create_task function. Use it when:
- User explicitly asks to create/add a task
- User describes something they need to do
- You suggest a task and user agrees
- You proactively recommend breaking down work into tasks

When creating tasks:
- Set appropriate priority (high/medium/low) based on urgency
- Add due dates when mentioned or logically inferred
- Include relevant tags for categorization
- Add projects for related work
- Write clear, actionable task titles

Be proactive - if you detect work that should become a task, suggest creating it and then DO IT with the function!`;

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('Lovable API key not found');
    }

    // Prepare messages with conversation history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.isBot ? 'assistant' : 'user',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        tools: [
          {
            type: 'function',
            function: {
              name: 'create_task',
              description: 'Create a new task in the database. Use this whenever the user wants to add a task or when you recommend creating a task.',
              parameters: {
                type: 'object',
                properties: {
                  title: { 
                    type: 'string',
                    description: 'Clear, actionable task title'
                  },
                  description: { 
                    type: 'string',
                    description: 'Detailed description of the task (optional)'
                  },
                  priority: { 
                    type: 'string',
                    enum: ['low', 'medium', 'high'],
                    description: 'Task priority level'
                  },
                  due_date: { 
                    type: 'string',
                    description: 'Due date in YYYY-MM-DD format (optional)'
                  },
                  due_time: { 
                    type: 'string',
                    description: 'Due time in HH:MM:SS format (optional)'
                  },
                  project: { 
                    type: 'string',
                    description: 'Project name for grouping tasks (optional)'
                  },
                  tags: { 
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of tags for categorization (optional)'
                  }
                },
                required: ['title', 'priority']
              }
            }
          }
        ],
        tool_choice: 'auto'
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
    const choice = data.choices[0];
    
    // Check if AI wants to call the create_task function
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      console.log('AI is creating tasks:', choice.message.tool_calls);
      
      const createdTasks = [];
      
      for (const toolCall of choice.message.tool_calls) {
        if (toolCall.function.name === 'create_task') {
          const taskData = JSON.parse(toolCall.function.arguments);
          
          // Create the task in the database
          const { data: newTask, error: createError } = await supabase
            .from('tasks')
            .insert({
              user_id: userId,
              title: taskData.title,
              description: taskData.description || null,
              priority: taskData.priority,
              due_date: taskData.due_date || null,
              due_time: taskData.due_time || null,
              project: taskData.project || null,
              tags: taskData.tags || [],
              completed: false
            })
            .select()
            .single();
          
          if (createError) {
            console.error('Error creating task:', createError);
            throw new Error('Failed to create task');
          }
          
          console.log('Task created successfully:', newTask);
          createdTasks.push(newTask);
        }
      }
      
      // Generate a follow-up response about the created tasks
      const followUpResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            ...messages,
            { 
              role: 'assistant', 
              content: `I've created ${createdTasks.length} task(s) for you.` 
            },
            { 
              role: 'user', 
              content: `Confirm to the user what tasks were created: ${JSON.stringify(createdTasks.map(t => ({ title: t.title, priority: t.priority, due_date: t.due_date })))}. Be encouraging and brief.` 
            }
          ]
        }),
      });
      
      const followUpData = await followUpResponse.json();
      const aiResponse = followUpData.choices[0].message.content;
      
      console.log('AI Assistant response with task creation:', aiResponse);
      
      return new Response(JSON.stringify({ 
        response: aiResponse,
        tasksCreated: createdTasks,
        taskSummary: {
          total: tasks.length + createdTasks.length,
          completed: tasks.filter(t => t.completed).length,
          pending: tasks.filter(t => !t.completed).length + createdTasks.length,
          overdue: overdueTasks.length,
          dueToday: todayTasks.length
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Regular response without tool calls
    const aiResponse = choice.message.content;

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
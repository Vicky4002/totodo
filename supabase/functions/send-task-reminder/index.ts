import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailNotificationRequest {
  email: string;
  taskTitle: string;
  dueDate: string;
  dueTime?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, taskTitle, dueDate, dueTime }: EmailNotificationRequest = await req.json();

    const dueDateFormatted = new Date(dueDate).toLocaleDateString();
    const timeString = dueTime ? ` at ${dueTime}` : '';

    const emailResponse = await resend.emails.send({
      from: "ToTodo <notifications@resend.dev>",
      to: [email],
      subject: `Task Reminder: ${taskTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; margin-bottom: 20px;">📋 Task Reminder</h1>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #495057; margin-top: 0;">${taskTitle}</h2>
            <p style="color: #6c757d; margin-bottom: 10px;">
              <strong>Due:</strong> ${dueDateFormatted}${timeString}
            </p>
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; color: #856404;">
              ⏰ <strong>Reminder:</strong> This task is due soon! Don't forget to complete it.
            </p>
          </div>
          
          <p style="color: #6c757d; font-size: 14px;">
            This is an automated reminder from your ToTodo task management app.
          </p>
        </div>
      `,
    });

    console.log("Email notification sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-task-reminder function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
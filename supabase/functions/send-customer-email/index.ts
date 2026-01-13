import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CustomerEmailRequest {
  to: string;
  subject: string;
  content: string;
  senderName: string;
  senderEmail: string;
  customerName: string;
}

// Escape HTML entities to prevent XSS in email templates
function escapeHtml(text: string | undefined | null): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const handler = async (req: Request): Promise<Response> => {
  console.log('send-customer-email function called');

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client to verify user
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Invalid authentication:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin or manager role
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('Error checking user roles:', rolesError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userRoles = roles?.map(r => r.role) || [];
    const hasPermission = userRoles.includes('admin') || userRoles.includes('manager');

    if (!hasPermission) {
      console.error('User lacks required role:', user.id);
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authorized:', user.id);

    const { 
      to, 
      subject, 
      content, 
      senderName, 
      senderEmail, 
      customerName 
    }: CustomerEmailRequest = await req.json();

    // Validate inputs
    if (!to || !subject || !content || !senderName || !senderEmail || !customerName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Sending email to customer');

    // Format the email content with proper HTML structure and escaped content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>${escapeHtml(subject)}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #f8f9fa;
              padding: 20px;
              border-radius: 8px 8px 0 0;
              border-bottom: 3px solid #007bff;
            }
            .content {
              background-color: #ffffff;
              padding: 30px 20px;
              border-radius: 0 0 8px 8px;
              border: 1px solid #e9ecef;
              border-top: none;
            }
            .footer {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #e9ecef;
              font-size: 12px;
              color: #6c757d;
              text-align: center;
            }
            .content-text {
              white-space: pre-line;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin: 0; color: #007bff;">${escapeHtml(subject)}</h2>
          </div>
          <div class="content">
            <div class="content-text">${escapeHtml(content)}</div>
          </div>
          <div class="footer">
            <p>This email was sent to ${escapeHtml(customerName)} (${escapeHtml(to)}) from ${escapeHtml(senderName)}</p>
            <p>If you received this email in error, please contact us.</p>
          </div>
        </body>
      </html>
    `;

    // Send the email using Resend
    const emailResponse = await resend.emails.send({
      from: `${senderName} <${senderEmail}>`,
      to: [to],
      subject: subject,
      html: htmlContent,
      text: content, // Plain text fallback
    });

    if (emailResponse.error) {
      console.error("Error sending email:", emailResponse.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Failed to send email. Please try again." 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Email sent successfully:", emailResponse.data?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.data?.id,
        message: "Email sent successfully" 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-customer-email function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Failed to send email. Please try again later." 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);

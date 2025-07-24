import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

const handler = async (req: Request): Promise<Response> => {
  console.log('send-customer-email function called');

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      to, 
      subject, 
      content, 
      senderName, 
      senderEmail, 
      customerName 
    }: CustomerEmailRequest = await req.json();

    console.log('Sending email to:', to, 'from:', senderEmail);

    // Format the email content with proper HTML structure
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>${subject}</title>
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
            <h2 style="margin: 0; color: #007bff;">${subject}</h2>
          </div>
          <div class="content">
            <div class="content-text">${content}</div>
          </div>
          <div class="footer">
            <p>This email was sent to ${customerName} (${to}) from ${senderName}</p>
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

    console.log("Email sent successfully:", emailResponse);

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
        error: error.message,
        message: "Failed to send email" 
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
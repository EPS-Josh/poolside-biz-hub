import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  appUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('send-customer-invitation function called');

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { 
      customerId, 
      email, 
      firstName, 
      lastName,
      companyName,
      appUrl
    }: InvitationRequest = await req.json();

    // Get the application URL from parameter or request referer
    const baseUrl = appUrl || req.headers.get('referer')?.split('/customer')[0] || 'https://lovableproject.com';

    console.log('Creating invitation for customer:', customerId, email);

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    let authUserId: string;
    let tempPassword: string | null = null;

    if (existingUser) {
      console.log('User already exists:', existingUser.id);
      authUserId = existingUser.id;
      
      // Update user metadata
      await supabase.auth.admin.updateUserById(existingUser.id, {
        user_metadata: {
          full_name: `${firstName} ${lastName}`,
          is_customer: true,
        },
      });
    } else {
      // Create a temporary password
      tempPassword = crypto.randomUUID().slice(0, 12);

      // Create auth user account
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: `${firstName} ${lastName}`,
          is_customer: true,
        },
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        throw new Error(`Failed to create user account: ${authError.message}`);
      }

      console.log('Auth user created:', authData.user.id);
      authUserId = authData.user.id;
    }

    // Link the auth user to the customer record
    const { error: updateError } = await supabase
      .from('customers')
      .update({ customer_user_id: authUserId })
      .eq('id', customerId);

    if (updateError) {
      console.error('Error linking customer account:', updateError);
      throw new Error(`Failed to link customer account: ${updateError.message}`);
    }

    // Assign customer role (only if doesn't exist)
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', authUserId)
      .eq('role', 'customer')
      .single();

    if (!existingRole) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authUserId,
          role: 'customer',
        });

      if (roleError) {
        console.error('Error assigning customer role:', roleError);
      }
    }

    console.log('Customer account linked successfully');

    // Only send email with password if it's a new user
    if (tempPassword) {
      // Send invitation email with temporary password
      const loginUrl = `${baseUrl}/customer-login`;
      
      const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Welcome to ${companyName} Client Portal</title>
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
              padding: 30px 20px;
              border-radius: 8px 8px 0 0;
              border-bottom: 3px solid #007bff;
              text-align: center;
            }
            .content {
              background-color: #ffffff;
              padding: 30px 20px;
              border-radius: 0 0 8px 8px;
              border: 1px solid #e9ecef;
              border-top: none;
            }
            .credentials {
              background-color: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #007bff;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #007bff;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #e9ecef;
              font-size: 12px;
              color: #6c757d;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; color: #007bff;">Welcome to Our Client Portal</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>
            
            <p>You've been invited to access your client portal at ${companyName}. Through the portal, you can:</p>
            
            <ul>
              <li>View your service history</li>
              <li>Schedule appointments</li>
              <li>Access your property photos and documents</li>
              <li>Request new services</li>
              <li>Update your contact information</li>
            </ul>
            
            <div class="credentials">
              <h3 style="margin-top: 0;">Your Login Credentials</h3>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Temporary Password:</strong> ${tempPassword}</p>
              <p style="font-size: 14px; color: #6c757d; margin-bottom: 0;">
                <em>Please change your password after your first login.</em>
              </p>
            </div>
            
            <div style="text-align: center;">
              <a href="${loginUrl}" class="button">Access Client Portal</a>
            </div>
            
            <p style="font-size: 14px; color: #6c757d;">
              If you have any questions or need assistance, please don't hesitate to contact us.
            </p>
          </div>
          <div class="footer">
            <p>This email was sent from ${companyName}</p>
            <p>If you received this email in error, please contact us.</p>
          </div>
        </body>
      </html>
    `;

      const emailResponse = await resend.emails.send({
        from: `${companyName} <noreply@finestpoolsandspas.com>`,
        to: [email],
        subject: `Welcome to ${companyName} Client Portal`,
        html: htmlContent,
      });

      if (emailResponse.error) {
        console.error("Error sending invitation email:", emailResponse.error);
        throw new Error(`Failed to send email: ${emailResponse.error.message}`);
      }

      console.log("Invitation email sent successfully:", emailResponse);

      return new Response(
        JSON.stringify({ 
          success: true, 
          userId: authUserId,
          emailId: emailResponse.data?.id,
          message: "Customer invitation sent successfully" 
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    } else {
      // User already exists, send portal access notification
      console.log("User already exists, sending portal access notification");
      
      const loginUrl = `${baseUrl}/customer-login`;
      
      const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>${companyName} Client Portal Access</title>
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
              padding: 30px 20px;
              border-radius: 8px 8px 0 0;
              border-bottom: 3px solid #007bff;
              text-align: center;
            }
            .content {
              background-color: #ffffff;
              padding: 30px 20px;
              border-radius: 0 0 8px 8px;
              border: 1px solid #e9ecef;
              border-top: none;
            }
            .info-box {
              background-color: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #007bff;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #007bff;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #e9ecef;
              font-size: 12px;
              color: #6c757d;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; color: #007bff;">Client Portal Access Granted</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>
            
            <p>Good news! You now have access to your client portal at ${companyName}. Through the portal, you can:</p>
            
            <ul>
              <li>View your service history</li>
              <li>Schedule appointments</li>
              <li>Access your property photos and documents</li>
              <li>Request new services</li>
              <li>Update your contact information</li>
            </ul>
            
            <div class="info-box">
              <h3 style="margin-top: 0;">Login Information</h3>
              <p>Use your existing account credentials to log in:</p>
              <p><strong>Email:</strong> ${email}</p>
              <p style="font-size: 14px; color: #6c757d; margin-bottom: 0;">
                <em>If you don't remember your password, use the "Forgot Password" option on the login page.</em>
              </p>
            </div>
            
            <div style="text-align: center;">
              <a href="${loginUrl}" class="button">Access Client Portal</a>
            </div>
            
            <p style="font-size: 14px; color: #6c757d;">
              If you have any questions or need assistance, please don't hesitate to contact us.
            </p>
          </div>
          <div class="footer">
            <p>This email was sent from ${companyName}</p>
            <p>If you received this email in error, please contact us.</p>
          </div>
        </body>
      </html>
    `;

      const emailResponse = await resend.emails.send({
        from: `${companyName} <noreply@finestpoolsandspas.com>`,
        to: [email],
        subject: `${companyName} Client Portal Access Granted`,
        html: htmlContent,
      });

      if (emailResponse.error) {
        console.error("Error sending portal access email:", emailResponse.error);
        throw new Error(`Failed to send email: ${emailResponse.error.message}`);
      }

      console.log("Portal access notification sent successfully:", emailResponse);

      return new Response(
        JSON.stringify({ 
          success: true, 
          userId: authUserId,
          emailId: emailResponse.data?.id,
          message: "Portal access granted and notification sent" 
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
  } catch (error: any) {
    console.error("Error in send-customer-invitation function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        message: "Failed to send customer invitation" 
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

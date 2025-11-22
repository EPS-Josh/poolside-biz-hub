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
    // Get JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the JWT token
    const token = authHeader.replace('Bearer ', '');
    
    // Create anon client for JWT verification
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    
    // Verify the JWT by passing the token directly
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Invalid authentication:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.id);
    
    // Create service role client for admin operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

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
      console.error('User lacks required role:', user.id, userRoles);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin or Manager role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authorized:', user.id, userRoles);

    const {
      customerId, 
      email, 
      firstName, 
      lastName,
      companyName,
      appUrl
    }: InvitationRequest = await req.json();

    // Get the application URL from parameter or request referer
    const baseUrl = appUrl || req.headers.get('referer')?.split('/customer')[0] || 'https://poolside.fps-tucson.com';

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
          requires_password_change: true,
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
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f0f9ff;
            }
            .email-container {
              max-width: 600px;
              margin: 40px auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .logo {
              max-width: 280px;
              height: auto;
              margin-bottom: 20px;
            }
            .header-text {
              color: #ffffff;
              font-size: 24px;
              font-weight: 600;
              margin: 0;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 18px;
              color: #1f2937;
              margin-bottom: 20px;
              font-weight: 500;
            }
            .message {
              color: #4b5563;
              font-size: 15px;
              margin-bottom: 20px;
              line-height: 1.6;
            }
            .features-list {
              background-color: #f8fafc;
              border-left: 4px solid #0891b2;
              padding: 20px 24px;
              margin: 24px 0;
              border-radius: 8px;
            }
            .features-list ul {
              margin: 0;
              padding-left: 20px;
              color: #4b5563;
            }
            .features-list li {
              margin: 8px 0;
            }
            .credentials-box {
              background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
              border: 2px solid #0891b2;
              padding: 24px;
              border-radius: 8px;
              margin: 30px 0;
            }
            .credentials-title {
              color: #0c4a6e;
              font-size: 18px;
              font-weight: 600;
              margin: 0 0 16px 0;
            }
            .credential-item {
              margin: 12px 0;
              font-size: 15px;
            }
            .credential-label {
              color: #0c4a6e;
              font-weight: 600;
              display: inline-block;
              min-width: 140px;
            }
            .credential-value {
              color: #1e293b;
              font-family: 'Courier New', monospace;
              background-color: #ffffff;
              padding: 6px 12px;
              border-radius: 4px;
              display: inline-block;
              margin-left: 8px;
            }
            .security-note {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 16px;
              margin: 24px 0;
              border-radius: 4px;
              font-size: 14px;
              color: #92400e;
            }
            .button-container {
              text-align: center;
              margin: 32px 0;
            }
            .button {
              display: inline-block;
              padding: 16px 40px;
              background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 4px 6px rgba(8, 145, 178, 0.3);
              transition: transform 0.2s;
            }
            .button:hover {
              transform: translateY(-2px);
            }
            .support-text {
              font-size: 14px;
              color: #6b7280;
              text-align: center;
              margin-top: 24px;
            }
            .footer {
              background-color: #1e293b;
              padding: 30px;
              text-align: center;
            }
            .footer-text {
              color: #94a3b8;
              font-size: 13px;
              margin: 8px 0;
            }
            .footer-logo {
              max-width: 200px;
              height: auto;
              margin-bottom: 16px;
              opacity: 0.8;
            }
            .divider {
              height: 1px;
              background: linear-gradient(to right, transparent, #e5e7eb, transparent);
              margin: 24px 0;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <img 
                src="${baseUrl}/lovable-uploads/7105f4fa-22d9-4992-80aa-e0b6effc3bae.png" 
                alt="${companyName} Logo" 
                class="logo"
              />
              <p class="header-text">Welcome to Your Client Portal</p>
            </div>
            
            <div class="content">
              <p class="greeting">Hello ${firstName},</p>
              
              <p class="message">
                Welcome to ${companyName}! We're excited to have you on board. Your client portal account has been created, 
                giving you 24/7 access to manage your pool service needs.
              </p>
              
              <div class="features-list">
                <strong style="color: #0c4a6e; display: block; margin-bottom: 12px;">What you can do in your portal:</strong>
                <ul>
                  <li>📅 View and manage your service appointments</li>
                  <li>📋 Access your complete service history</li>
                  <li>📸 View photos and documents from your property</li>
                  <li>🔧 Request new services or repairs</li>
                  <li>👤 Update your contact information</li>
                </ul>
              </div>
              
              <div class="credentials-box">
                <h3 class="credentials-title">🔐 Your Login Credentials</h3>
                <div class="credential-item">
                  <span class="credential-label">Email:</span>
                  <span class="credential-value">${email}</span>
                </div>
                <div class="credential-item">
                  <span class="credential-label">Temporary Password:</span>
                  <span class="credential-value">${tempPassword}</span>
                </div>
              </div>
              
              <div class="security-note">
                <strong>⚠️ Important Security Notice:</strong><br/>
                For your security, you will be required to change this temporary password on your first login. 
                Please choose a strong password that you haven't used elsewhere.
              </div>
              
              <div class="button-container">
                <a href="${loginUrl}" class="button">Access Your Client Portal</a>
              </div>
              
              <div class="divider"></div>
              
              <p class="support-text">
                Need help? Contact us at <strong>(520) 728-3002</strong> or 
                <strong>info@finestpoolsandspas.com</strong>
              </p>
            </div>
            
            <div class="footer">
              <img 
                src="${baseUrl}/lovable-uploads/53f22dfe-4ebf-46fa-bb95-1a316a61d772.png" 
                alt="${companyName} Logo" 
                class="footer-logo"
              />
              <p class="footer-text">© 2025 ${companyName}</p>
              <p class="footer-text">Keeping your pool perfect, one service at a time.</p>
              <p class="footer-text" style="margin-top: 16px;">
                PO Box 40144, Tucson, AZ 85717<br/>
                Serving the Greater Tucson Area
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

      const emailResponse = await resend.emails.send({
        from: `${companyName} <portal@finestpoolsandspas.com>`,
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
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f0f9ff;
            }
            .email-container {
              max-width: 600px;
              margin: 40px auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .logo {
              max-width: 280px;
              height: auto;
              margin-bottom: 20px;
            }
            .header-text {
              color: #ffffff;
              font-size: 24px;
              font-weight: 600;
              margin: 0;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 18px;
              color: #1f2937;
              margin-bottom: 20px;
              font-weight: 500;
            }
            .message {
              color: #4b5563;
              font-size: 15px;
              margin-bottom: 20px;
              line-height: 1.6;
            }
            .features-list {
              background-color: #f8fafc;
              border-left: 4px solid #0891b2;
              padding: 20px 24px;
              margin: 24px 0;
              border-radius: 8px;
            }
            .features-list ul {
              margin: 0;
              padding-left: 20px;
              color: #4b5563;
            }
            .features-list li {
              margin: 8px 0;
            }
            .info-box {
              background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
              border: 2px solid #0891b2;
              padding: 24px;
              border-radius: 8px;
              margin: 30px 0;
            }
            .info-title {
              color: #0c4a6e;
              font-size: 18px;
              font-weight: 600;
              margin: 0 0 16px 0;
            }
            .info-text {
              color: #4b5563;
              font-size: 15px;
              margin: 12px 0;
            }
            .email-highlight {
              color: #0c4a6e;
              font-weight: 600;
              background-color: #ffffff;
              padding: 6px 12px;
              border-radius: 4px;
              display: inline-block;
              margin-left: 8px;
            }
            .button-container {
              text-align: center;
              margin: 32px 0;
            }
            .button {
              display: inline-block;
              padding: 16px 40px;
              background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 4px 6px rgba(8, 145, 178, 0.3);
              transition: transform 0.2s;
            }
            .button:hover {
              transform: translateY(-2px);
            }
            .help-note {
              background-color: #f8fafc;
              border-left: 4px solid #8b5cf6;
              padding: 16px;
              margin: 24px 0;
              border-radius: 4px;
              font-size: 14px;
              color: #4b5563;
            }
            .support-text {
              font-size: 14px;
              color: #6b7280;
              text-align: center;
              margin-top: 24px;
            }
            .footer {
              background-color: #1e293b;
              padding: 30px;
              text-align: center;
            }
            .footer-text {
              color: #94a3b8;
              font-size: 13px;
              margin: 8px 0;
            }
            .footer-logo {
              max-width: 200px;
              height: auto;
              margin-bottom: 16px;
              opacity: 0.8;
            }
            .divider {
              height: 1px;
              background: linear-gradient(to right, transparent, #e5e7eb, transparent);
              margin: 24px 0;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <img 
                src="${baseUrl}/lovable-uploads/7105f4fa-22d9-4992-80aa-e0b6effc3bae.png" 
                alt="${companyName} Logo" 
                class="logo"
              />
              <p class="header-text">Client Portal Access Granted</p>
            </div>
            
            <div class="content">
              <p class="greeting">Hello ${firstName},</p>
              
              <p class="message">
                Great news! You now have access to your client portal at ${companyName}. 
                Your portal gives you 24/7 access to all your pool service information and makes managing your account easier than ever.
              </p>
              
              <div class="features-list">
                <strong style="color: #0c4a6e; display: block; margin-bottom: 12px;">What you can do in your portal:</strong>
                <ul>
                  <li>📅 View and manage your service appointments</li>
                  <li>📋 Access your complete service history</li>
                  <li>📸 View photos and documents from your property</li>
                  <li>🔧 Request new services or repairs</li>
                  <li>👤 Update your contact information</li>
                </ul>
              </div>
              
              <div class="info-box">
                <h3 class="info-title">🔐 Login Information</h3>
                <p class="info-text">
                  Use your existing account credentials to log in:
                </p>
                <p class="info-text">
                  <strong>Email:</strong><span class="email-highlight">${email}</span>
                </p>
              </div>
              
              <div class="help-note">
                <strong>💡 Forgot your password?</strong><br/>
                No problem! Use the "Forgot Password" option on the login page to reset it.
              </div>
              
              <div class="button-container">
                <a href="${loginUrl}" class="button">Access Your Client Portal</a>
              </div>
              
              <div class="divider"></div>
              
              <p class="support-text">
                Need help? Contact us at <strong>(520) 728-3002</strong> or 
                <strong>info@finestpoolsandspas.com</strong>
              </p>
            </div>
            
            <div class="footer">
              <img 
                src="${baseUrl}/lovable-uploads/53f22dfe-4ebf-46fa-bb95-1a316a61d772.png" 
                alt="${companyName} Logo" 
                class="footer-logo"
              />
              <p class="footer-text">© 2025 ${companyName}</p>
              <p class="footer-text">Keeping your pool perfect, one service at a time.</p>
              <p class="footer-text" style="margin-top: 16px;">
                PO Box 40144, Tucson, AZ 85717<br/>
                Serving the Greater Tucson Area
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

      const emailResponse = await resend.emails.send({
        from: `${companyName} <portal@finestpoolsandspas.com>`,
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

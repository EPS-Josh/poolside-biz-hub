
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ServiceRequestData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  serviceType: string;
  preferredContactMethod: 'phone' | 'email';
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role key for database operations to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const requestData: ServiceRequestData = await req.json();
    
    // Server-side validation
    if (!requestData.firstName || typeof requestData.firstName !== 'string' || 
        requestData.firstName.trim().length === 0 || requestData.firstName.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid first name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!requestData.lastName || typeof requestData.lastName !== 'string' ||
        requestData.lastName.trim().length === 0 || requestData.lastName.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid last name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!requestData.email || typeof requestData.email !== 'string' ||
        !emailRegex.test(requestData.email) || requestData.email.length > 255) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!requestData.phone || typeof requestData.phone !== 'string' ||
        requestData.phone.trim().length === 0 || requestData.phone.length > 20) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!requestData.address || typeof requestData.address !== 'string' ||
        requestData.address.trim().length === 0 || requestData.address.length > 500) {
      return new Response(
        JSON.stringify({ error: 'Invalid address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!requestData.serviceType || typeof requestData.serviceType !== 'string' ||
        requestData.serviceType.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid service type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!requestData.preferredContactMethod || 
        !['phone', 'email', 'either'].includes(requestData.preferredContactMethod.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: 'Invalid contact method' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (requestData.message && (typeof requestData.message !== 'string' || requestData.message.length > 2000)) {
      return new Response(
        JSON.stringify({ error: 'Message too long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Basic rate limiting check
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `service-request:${clientIp}`;
    
    const { data: recentRequests } = await supabaseClient
      .from('rate_limit_log')
      .select('request_count')
      .eq('endpoint', 'send-service-request-email')
      .eq('identifier', clientIp)
      .gte('window_start', new Date(Date.now() - 3600000).toISOString())
      .maybeSingle();

    if (recentRequests && recentRequests.request_count >= 5) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the request for rate limiting
    await supabaseClient
      .from('rate_limit_log')
      .insert({
        endpoint: 'send-service-request-email',
        identifier: clientIp,
        request_count: (recentRequests?.request_count || 0) + 1,
        window_start: new Date().toISOString()
      });

    console.log('Service request validated:', requestData);

    // Insert into database
    const { data: serviceRequest, error: dbError } = await supabaseClient
      .from('service_requests')
      .insert({
        first_name: requestData.firstName,
        last_name: requestData.lastName,
        email: requestData.email,
        phone: requestData.phone,
        address: requestData.address,
        service_type: requestData.serviceType,
        preferred_contact_method: requestData.preferredContactMethod,
        message: requestData.message || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log('Service request saved to database:', serviceRequest);

    // Send notification email to business - now with multiple recipients
    const businessEmailResponse = await resend.emails.send({
      from: "Pool Service <noreply@finestpoolsandspas.com>",
      to: [
        "info@finestpoolsandspas.com",
        "lance@finestpoolsandspas.com" // Updated recipient
      ],
      subject: `New Service Request from ${requestData.firstName} ${requestData.lastName}`,
      html: `
        <h2>New Pool Service Request</h2>
        <h3>Customer Information:</h3>
        <p><strong>Name:</strong> ${requestData.firstName} ${requestData.lastName}</p>
        <p><strong>Email:</strong> ${requestData.email}</p>
        <p><strong>Phone:</strong> ${requestData.phone}</p>
        <p><strong>Address:</strong> ${requestData.address}</p>
        <p><strong>Service Type:</strong> ${requestData.serviceType}</p>
        <p><strong>Preferred Contact:</strong> ${requestData.preferredContactMethod}</p>
        ${requestData.message ? `<p><strong>Message:</strong> ${requestData.message}</p>` : ''}
        <p><strong>Request ID:</strong> ${serviceRequest.id}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
      `,
    });

    if (businessEmailResponse.error) {
      console.error("Error sending business notification email:", businessEmailResponse.error);
      throw new Error(`Failed to send business notification: ${businessEmailResponse.error.message}`);
    }

    // Send confirmation email to customer
    const customerEmailResponse = await resend.emails.send({
      from: "Finest Pools & Spas <noreply@finestpoolsandspas.com>",
      to: [requestData.email],
      subject: "We Received Your Pool Service Request!",
      html: `
        <h2>Thank you for your service request, ${requestData.firstName}!</h2>
        <p>We have received your request for <strong>${requestData.serviceType}</strong> and will contact you within 24 hours.</p>
        
        <h3>Your Request Details:</h3>
        <p><strong>Service Type:</strong> ${requestData.serviceType}</p>
        <p><strong>Property Address:</strong> ${requestData.address}</p>
        <p><strong>Preferred Contact Method:</strong> ${requestData.preferredContactMethod}</p>
        ${requestData.message ? `<p><strong>Your Message:</strong> ${requestData.message}</p>` : ''}
        
        <p>If you have any urgent questions, please call us at (520) 728-3002.</p>
        
        <p>Best regards,<br>
        The Finest Pools & Spas Team</p>
        
        <hr>
        <p><small>Request ID: ${serviceRequest.id}</small></p>
      `,
    });

    if (customerEmailResponse.error) {
      console.error("Error sending customer confirmation email:", customerEmailResponse.error);
      throw new Error(`Failed to send customer confirmation: ${customerEmailResponse.error.message}`);
    }

    console.log("Business email sent:", businessEmailResponse);
    console.log("Customer email sent:", customerEmailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        serviceRequest,
        emailsSent: {
          business: businessEmailResponse,
          customer: customerEmailResponse
        }
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
    console.error("Error in send-service-request-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
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

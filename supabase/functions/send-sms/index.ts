import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

interface SendSmsRequest {
  to: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin or manager role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const hasPermission = roles?.some(r => r.role === 'admin' || r.role === 'manager');
    if (!hasPermission) {
      console.error('User lacks permission:', user.id);
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { to, message, customerId }: SendSmsRequest & { customerId?: string } = await req.json();

    if (!to || !message) {
      throw new Error('Missing required fields: to and message');
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(to.replace(/[\s()-]/g, ''))) {
      throw new Error('Invalid phone number format');
    }

    console.log('Sending SMS to:', to);

    let messageSid: string | null = null;
    let smsStatus = 'pending';
    let errorMsg: string | null = null;

    try {
      // Send SMS via Twilio
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
      const formData = new URLSearchParams();
      formData.append('To', to);
      formData.append('From', twilioPhoneNumber!);
      formData.append('Body', message);

      const twilioResponse = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!twilioResponse.ok) {
        const errorData = await twilioResponse.json();
        console.error('Twilio API error:', errorData);
        errorMsg = errorData.message || 'Unknown error';
        smsStatus = 'failed';
        throw new Error(`Twilio API error: ${errorMsg}`);
      }

      const twilioData = await twilioResponse.json();
      console.log('SMS sent successfully:', twilioData.sid);
      
      messageSid = twilioData.sid;
      smsStatus = twilioData.status || 'sent';

      return new Response(
        JSON.stringify({ 
          success: true, 
          messageSid: twilioData.sid,
          status: twilioData.status 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } finally {
      // Log the SMS attempt to the database (whether successful or failed)
      try {
        const { error: logError } = await supabase
          .from('sms_logs')
          .insert({
            user_id: user.id,
            customer_id: customerId || null,
            phone_number: to,
            message_content: message,
            message_sid: messageSid,
            status: smsStatus,
            error_message: errorMsg,
            sent_at: new Date().toISOString(),
          });

        if (logError) {
          console.error('Failed to log SMS to database:', logError);
        } else {
          console.log('SMS logged to database successfully');
        }
      } catch (dbError) {
        console.error('Error logging SMS to database:', dbError);
      }
    }
  } catch (error: any) {
    console.error('Error in send-sms function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);

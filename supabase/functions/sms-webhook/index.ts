import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse incoming SMS data from Twilio
    const formData = await req.formData();
    const from = formData.get('From') as string; // Customer's phone number
    const body = formData.get('Body') as string; // Message content
    const messageSid = formData.get('MessageSid') as string;

    console.log('Incoming SMS:', { from, body, messageSid });

    if (!from || !body) {
      return new Response('Missing required fields', { status: 400, headers: corsHeaders });
    }

    // Normalize phone number (remove +1 and formatting)
    const normalizedPhone = from.replace(/^\+1/, '').replace(/\D/g, '');
    const messageUppercase = body.trim().toUpperCase();

    // Find customer by phone number
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id, first_name, sms_opt_in, user_id')
      .or(`phone.eq.${normalizedPhone},phone.eq.+1${normalizedPhone},phone.eq.${from}`)
      .limit(1);

    if (customerError) {
      console.error('Error finding customer:', customerError);
      return new Response('Error processing message', { status: 500, headers: corsHeaders });
    }

    let responseMessage = '';
    let customer = customers?.[0];

    // Handle OPT-IN keywords (Y, YES, OK)
    if (['Y', 'YES', 'OK'].includes(messageUppercase)) {
      if (customer) {
        const { error: updateError } = await supabase
          .from('customers')
          .update({
            sms_opt_in: true,
            sms_opt_in_date: new Date().toISOString(),
            phone_verified: true
          })
          .eq('id', customer.id);

        if (updateError) {
          console.error('Error updating opt-in:', updateError);
        } else {
          console.log(`Customer ${customer.id} opted in to SMS`);
        }
      }

      responseMessage = "You're now subscribed to service notifications from Finest Pools & Spas. Reply STOP to opt out or HELP for help. Msg&data rates may apply.";
    }
    // Handle OPT-OUT keyword (STOP)
    else if (['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'].includes(messageUppercase)) {
      if (customer) {
        const { error: updateError } = await supabase
          .from('customers')
          .update({
            sms_opt_in: false
          })
          .eq('id', customer.id);

        if (updateError) {
          console.error('Error updating opt-out:', updateError);
        } else {
          console.log(`Customer ${customer.id} opted out of SMS`);
        }
      }

      responseMessage = "You've been unsubscribed from Finest Pools & Spas SMS notifications. Reply START to resubscribe.";
    }
    // Handle HELP keyword
    else if (['HELP', 'INFO'].includes(messageUppercase)) {
      responseMessage = "Finest Pools & Spas service notifications. For help, visit poolside.fps-tucson.com or call us. Reply STOP to opt out. Msg&data rates may apply.";
    }
    // Handle START (re-subscribe after STOP)
    else if (['START', 'UNSTOP'].includes(messageUppercase)) {
      if (customer) {
        const { error: updateError } = await supabase
          .from('customers')
          .update({
            sms_opt_in: true,
            sms_opt_in_date: new Date().toISOString(),
            phone_verified: true
          })
          .eq('id', customer.id);

        if (updateError) {
          console.error('Error updating re-subscribe:', updateError);
        } else {
          console.log(`Customer ${customer.id} re-subscribed to SMS`);
        }
      }

      responseMessage = "You're now subscribed to service notifications from Finest Pools & Spas. Reply STOP to opt out or HELP for help. Msg&data rates may apply.";
    }
    // Unknown message - log it but don't respond
    else {
      console.log(`Received non-keyword message from ${from}: ${body}`);
      // Log the incoming message for staff to review
      if (customer) {
        await supabase.from('sms_logs').insert({
          user_id: customer.user_id,
          customer_id: customer.id,
          phone_number: from,
          message_content: `INBOUND: ${body}`,
          status: 'received',
          message_sid: messageSid
        });
      }
      
      // Return empty TwiML (no auto-response)
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'text/xml' } 
        }
      );
    }

    // Log the interaction
    if (customer) {
      await supabase.from('sms_logs').insert({
        user_id: customer.user_id,
        customer_id: customer.id,
        phone_number: from,
        message_content: `INBOUND: ${body}`,
        status: 'received',
        message_sid: messageSid
      });
    }

    // Return TwiML response to send message back to customer
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${responseMessage}</Message>
</Response>`;

    return new Response(twimlResponse, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' }
    });

  } catch (error) {
    console.error('Error processing SMS webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { createHmac } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;

// Validate Twilio signature to ensure request is from Twilio
function validateTwilioSignature(
  signature: string | null,
  url: string,
  params: Record<string, string>,
  authToken: string
): boolean {
  if (!signature) return false;
  
  // Sort params alphabetically and concatenate key + value
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => key + params[key])
    .join('');
  
  // Create HMAC-SHA1 of URL + sorted params
  const expectedSig = createHmac('sha1', authToken)
    .update(url + sortedParams)
    .digest('base64');
  
  return signature === expectedSig;
}

// Escape special characters for XML/TwiML responses
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    
    // Convert FormData to object for signature validation
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });
    
    // Validate Twilio signature using the configured webhook URL
    // Twilio signs requests using the exact URL configured in their console
    const twilioSignature = req.headers.get('X-Twilio-Signature');
    const webhookUrl = 'https://fsqztictdjcguzchlcdf.supabase.co/functions/v1/sms-webhook';
    
    if (!validateTwilioSignature(twilioSignature, webhookUrl, params, TWILIO_AUTH_TOKEN)) {
      console.error('Invalid Twilio signature - rejecting request');
      console.error('Signature received:', twilioSignature);
      console.error('Webhook URL used:', webhookUrl);
      console.error('Params:', JSON.stringify(params));
      return new Response('Invalid signature', { status: 403, headers: corsHeaders });
    }
    
    console.log('Twilio signature validated successfully');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse incoming SMS data from Twilio
    const from = params['From']; // Customer's phone number
    const body = params['Body']; // Message content
    const messageSid = params['MessageSid'];

    console.log('Incoming SMS:', { from, body, messageSid });

    if (!from || !body) {
      return new Response('Missing required fields', { status: 400, headers: corsHeaders });
    }

    // Normalize phone number (remove +1 and formatting)
    const normalizedPhone = from.replace(/^\+1/, '').replace(/\D/g, '');
    const messageUppercase = body.trim().toUpperCase();
    
    console.log('Normalized phone:', normalizedPhone);

    // Find customer by phone number - search using multiple formats
    // Database may store phones as "520 904 7410", "520-904-7410", "5209047410", etc.
    const { data: allCustomers, error: customerError } = await supabase
      .from('customers')
      .select('id, first_name, phone, sms_opt_in, user_id');

    if (customerError) {
      console.error('Error finding customer:', customerError);
      return new Response('Error processing message', { status: 500, headers: corsHeaders });
    }

    // Find customer by comparing normalized phone numbers
    const customer = allCustomers?.find(c => {
      if (!c.phone) return false;
      const customerNormalized = c.phone.replace(/\D/g, '');
      // Handle both with and without country code
      return customerNormalized === normalizedPhone || 
             customerNormalized === `1${normalizedPhone}` ||
             `1${customerNormalized}` === normalizedPhone;
    });

    console.log('Found customer:', customer ? `${customer.first_name} (${customer.id})` : 'none');

    if (customerError) {
      console.error('Error finding customer:', customerError);
      return new Response('Error processing message', { status: 500, headers: corsHeaders });
    }

    let responseMessage = '';

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

      responseMessage = "You're now subscribed to service notifications from Finest Pools and Spas. Reply STOP to opt out or HELP for help. Msg and data rates may apply.";
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

      responseMessage = "You've been unsubscribed from Finest Pools and Spas SMS notifications. Reply START to resubscribe.";
    }
    // Handle HELP keyword
    else if (['HELP', 'INFO'].includes(messageUppercase)) {
      responseMessage = "Finest Pools and Spas service notifications. For help, visit poolside.fps-tucson.com or call us. Reply STOP to opt out. Msg and data rates may apply.";
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

      responseMessage = "You're now subscribed to service notifications from Finest Pools and Spas. Reply STOP to opt out or HELP for help. Msg and data rates may apply.";
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
    // Use escapeXml to ensure special characters don't break XML parsing
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(responseMessage)}</Message>
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

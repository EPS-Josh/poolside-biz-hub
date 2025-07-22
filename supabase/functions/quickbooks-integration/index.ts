import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== QuickBooks Function Started ===');
    
    // Basic auth check
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.log('Auth failed:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User authenticated:', user.id);

    const { action, data } = await req.json();
    console.log('Action:', action);

    // Check environment variables
    const clientId = Deno.env.get('QUICKBOOKS_CLIENT_ID');
    const clientSecret = Deno.env.get('QUICKBOOKS_CLIENT_SECRET');
    
    console.log('QB Client ID exists:', !!clientId);
    console.log('QB Client Secret exists:', !!clientSecret);

    if (!clientId || !clientSecret) {
      console.log('Missing QuickBooks credentials');
      return new Response(JSON.stringify({ 
        error: 'QuickBooks credentials not configured. Please add QUICKBOOKS_CLIENT_ID and QUICKBOOKS_CLIENT_SECRET.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Simple test response
    if (action === 'sync_invoice') {
      console.log('Sync invoice action received for service record:', data.service_record_id);
      
      // Get QuickBooks connection
      const { data: connection, error: connError } = await supabaseClient
        .from('quickbooks_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (connError || !connection) {
        console.log('No QB connection found:', connError);
        return new Response(JSON.stringify({ 
          error: 'QuickBooks connection not found. Please connect to QuickBooks first.' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('QB connection found, company ID:', connection.company_id);
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'QuickBooks connection found but sync logic not implemented yet',
        debug: {
          connectionExists: true,
          companyId: connection.company_id,
          serviceRecordId: data.service_record_id
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
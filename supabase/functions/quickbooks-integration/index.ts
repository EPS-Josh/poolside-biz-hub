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

    // Handle OAuth URL generation
    if (action === 'get_oauth_url') {
      const redirectUri = data.redirect_uri || `${req.headers.get('origin')}/bpa`;
      const state = crypto.randomUUID();
      
      const oauthUrl = `https://appcenter.intuit.com/connect/oauth2?` +
        `client_id=${clientId}&` +
        `scope=com.intuit.quickbooks.accounting&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `state=${state}`;

      return new Response(JSON.stringify({ 
        success: true,
        oauth_url: oauthUrl 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle OAuth callback
    if (action === 'oauth_callback') {
      const { code, realmId, redirect_uri } = data;
      
      console.log('=== OAUTH CALLBACK ===');
      console.log('Code:', code);
      console.log('Realm ID:', realmId);
      
      try {
        // Exchange code for tokens
        const credentials = `${clientId}:${clientSecret}`;
        const encodedCredentials = btoa(credentials);
        
        const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${encodedCredentials}`,
          },
          body: `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(redirect_uri)}`,
        });

        const tokenData = await tokenResponse.json();
        console.log('Token response status:', tokenResponse.status);
        
        if (!tokenResponse.ok) {
          throw new Error(`Token exchange failed: ${JSON.stringify(tokenData)}`);
        }

        // Store connection in database
        await supabaseClient
          .from('quickbooks_connections')
          .upsert({
            user_id: user.id,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            company_id: realmId,
            token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
            is_active: true,
            updated_at: new Date().toISOString(),
          });

        return new Response(JSON.stringify({ 
          success: true,
          message: 'QuickBooks connection established successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (error) {
        console.error('OAuth callback error:', error);
        return new Response(JSON.stringify({ 
          error: error.message || 'OAuth callback failed' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    if (action === 'sync_invoice') {
      console.log('=== SYNC INVOICE STARTED ===');
      console.log('Service record ID:', data.service_record_id);
      
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
      
      // Get service record with customer data
      const { data: serviceRecord, error: serviceError } = await supabaseClient
        .from('service_records')
        .select(`
          *,
          customers (*)
        `)
        .eq('id', data.service_record_id)
        .single();

      if (serviceError || !serviceRecord) {
        console.error('Service record error:', serviceError);
        return new Response(JSON.stringify({ 
          error: `Service record not found: ${serviceError?.message || 'Unknown error'}` 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Service record found for customer:', serviceRecord.customers.first_name, serviceRecord.customers.last_name);

      // Function to refresh QuickBooks token
      const refreshQuickBooksToken = async () => {
        console.log('Refreshing QuickBooks token...');
        
        // Create base64 encoded credentials for Deno using btoa (available in Deno)
        const credentials = `${clientId}:${clientSecret}`;
        const encodedCredentials = btoa(credentials);
        
        const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${encodedCredentials}`,
          },
          body: `grant_type=refresh_token&refresh_token=${connection.refresh_token}`,
        });

        console.log('Token refresh response status:', tokenResponse.status);
        
        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error('Token refresh failed:', errorText);
          throw new Error(`Token refresh failed: ${errorText}`);
        }

        const tokenData = await tokenResponse.json();
        console.log('Token refreshed successfully');

        // Update the connection with new tokens
        await supabaseClient
          .from('quickbooks_connections')
          .update({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || connection.refresh_token,
            token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', connection.id);

        return tokenData.access_token;
      };

      // QuickBooks API setup
      let accessToken = connection.access_token;
      const quickbooksBaseUrl = `https://quickbooks.api.intuit.com/v3/company/${connection.company_id}`;
      
      const getAuthHeaders = () => ({
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      });

      // Create customer in QuickBooks - check if customer already exists first
      const rawCustomerName = `${serviceRecord.customers.first_name} ${serviceRecord.customers.last_name}`;
      
      // Sanitize customer name for QuickBooks (remove invalid characters and limit length)
      const customerName = rawCustomerName
        .replace(/[:\n\t\r]/g, ' ') // Replace problematic characters with spaces
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim()
        .substring(0, 100); // QuickBooks has a 100 character limit for Name field
      
      console.log('Customer name:', customerName);
      // Helper function to make QuickBooks API calls with token refresh retry
      const makeQBRequest = async (url: string, options: any, retryCount = 0) => {
        const response = await fetch(url, {
          ...options,
          headers: getAuthHeaders(),
        });

        // Capture intuit_tid for troubleshooting
        const intuitTid = response.headers.get('intuit_tid');
        if (intuitTid) {
          console.log('QuickBooks API intuit_tid:', intuitTid);
        }

        // If we get 401 (token expired) and haven't retried yet, refresh token and retry
        if (response.status === 401 && retryCount === 0) {
          console.log('Token expired, refreshing...');
          accessToken = await refreshQuickBooksToken();
          return makeQBRequest(url, options, 1); // Retry once
        }

        return response;
      };

      // First try to find existing customer
      console.log('Searching for existing customer...');
      const searchResponse = await makeQBRequest(`${quickbooksBaseUrl}/customer?where=Name='${encodeURIComponent(customerName)}'`, {
        method: 'GET',
      });

      let qbCustomerId;
      
      if (searchResponse.ok) {
        const searchResult = await searchResponse.json();
        console.log('Customer search result:', JSON.stringify(searchResult, null, 2));
        
        if (searchResult.QueryResponse?.Customer && searchResult.QueryResponse.Customer.length > 0) {
          qbCustomerId = searchResult.QueryResponse.Customer[0].Id;
          console.log('Found existing customer with ID:', qbCustomerId);
        }
      }
      
      // If customer doesn't exist, create new one
      if (!qbCustomerId) {
        const qbCustomer = {
          Name: customerName,
        };
        
        // Only add CompanyName if it exists and is not empty
        if (serviceRecord.customers.company && serviceRecord.customers.company.trim()) {
          qbCustomer.CompanyName = serviceRecord.customers.company.trim();
        }

        console.log('Creating customer in QuickBooks...');
        const customerResponse = await makeQBRequest(`${quickbooksBaseUrl}/customer`, {
          method: 'POST',
          body: JSON.stringify(qbCustomer),
        });

        console.log('Customer response status:', customerResponse.status);
        const customerResult = await customerResponse.json();
        console.log('Customer response:', JSON.stringify(customerResult, null, 2));

        if (!customerResponse.ok) {
          console.error('Customer creation failed');
          console.error('Status:', customerResponse.status);
          console.error('Response body:', JSON.stringify(customerResult, null, 2));
          return new Response(JSON.stringify({ 
            error: `QuickBooks customer error: ${customerResult.fault?.error?.[0]?.detail || customerResult.Fault?.Error?.[0]?.Detail || 'Unknown error'}`,
            details: customerResult
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        qbCustomerId = customerResult.QueryResponse?.Customer?.[0]?.Id;
        console.log('Customer created with ID:', qbCustomerId);
      }

      // Create invoice
      const invoice = {
        Line: [
          {
            Amount: 100.00,
            DetailType: "SalesItemLineDetail",
            SalesItemLineDetail: {
              ItemRef: {
                value: "1",  // Default service item - QuickBooks creates this by default
                name: "Services"
              },
              Qty: 1,
              UnitPrice: 100.00
            }
          }
        ],
        CustomerRef: {
          value: qbCustomerId
        },
        TxnDate: serviceRecord.service_date
      };

      console.log('Creating invoice in QuickBooks...');
      const invoiceResponse = await makeQBRequest(`${quickbooksBaseUrl}/invoice`, {
        method: 'POST',
        body: JSON.stringify(invoice),
      });

      console.log('Invoice response status:', invoiceResponse.status);
      const invoiceResult = await invoiceResponse.json();
      console.log('Invoice response:', JSON.stringify(invoiceResult, null, 2));

      if (!invoiceResponse.ok) {
        console.error('Invoice creation failed');
        return new Response(JSON.stringify({ 
          error: `QuickBooks invoice error: ${invoiceResult.fault?.error?.[0]?.detail || 'Unknown error'}` 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const qbInvoiceId = invoiceResult.QueryResponse?.Invoice?.[0]?.Id;
      console.log('Invoice created with ID:', qbInvoiceId);

      // Update sync status
      await supabaseClient
        .from('quickbooks_invoice_sync')
        .upsert({
          user_id: user.id,
          service_record_id: data.service_record_id,
          quickbooks_invoice_id: qbInvoiceId,
          sync_status: 'synced',
          last_synced_at: new Date().toISOString(),
        });

      console.log('Sync status updated in database');

      return new Response(JSON.stringify({ 
        success: true,
        message: 'Invoice synced to QuickBooks successfully',
        quickbooks_invoice_id: qbInvoiceId,
        quickbooks_customer_id: qbCustomerId
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
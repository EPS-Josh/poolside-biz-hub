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

    // QuickBooks sync logic
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

      // QuickBooks API setup
      const quickbooksBaseUrl = `https://sandbox-quickbooks.api.intuit.com/v3/company/${connection.company_id}`;
      const authHeaders = {
        'Authorization': `Bearer ${connection.access_token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

      // Create customer in QuickBooks - check if customer already exists first
      const customerName = `${serviceRecord.customers.first_name} ${serviceRecord.customers.last_name}`;
      
      // First try to find existing customer
      console.log('Searching for existing customer...');
      const searchResponse = await fetch(`${quickbooksBaseUrl}/customer?where=Name='${encodeURIComponent(customerName)}'`, {
        method: 'GET',
        headers: authHeaders,
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
        const customerResponse = await fetch(`${quickbooksBaseUrl}/customer`, {
          method: 'POST',
          headers: authHeaders,
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

        qbCustomerId = customerResult.QueryResponse?.Customer?.[0]?.Id || customerResult.customer?.Id;
        console.log('Customer created with ID:', qbCustomerId);
      }

      // Create invoice
      const invoice = {
        customerRef: {
          value: qbCustomerId,
        },
        txnDate: serviceRecord.service_date,
        line: [
          {
            amount: 100,
            detailType: "SalesItemLineDetail",
            salesItemLineDetail: {
              itemRef: {
                value: "HOURS",
                name: "Service Hours"
              },
              qty: 1,
              unitPrice: 100,
              taxCodeRef: {
                value: "NON"
              }
            },
          },
        ],
      };

      console.log('Creating invoice in QuickBooks...');
      const invoiceResponse = await fetch(`${quickbooksBaseUrl}/invoice`, {
        method: 'POST',
        headers: authHeaders,
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

      const qbInvoiceId = invoiceResult.QueryResponse?.Invoice?.[0]?.Id || invoiceResult.invoice?.Id;
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
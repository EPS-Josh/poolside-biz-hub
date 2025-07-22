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

      // Create a simple invoice in QuickBooks
      const quickbooksBaseUrl = `https://sandbox-quickbooks.api.intuit.com/v3/company/${connection.company_id}`;
      const authHeaders = {
        'Authorization': `Bearer ${connection.access_token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

      // First, create a simple customer in QuickBooks
      const qbCustomer = {
        Name: `${serviceRecord.customers.first_name} ${serviceRecord.customers.last_name}`,
        CompanyName: serviceRecord.customers.company || undefined,
      };

      const customerResponse = await fetch(`${quickbooksBaseUrl}/customer`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(qbCustomer),
      });

      console.log('Customer creation response status:', customerResponse.status);
      const customerResult = await customerResponse.json();
      console.log('Customer creation response:', JSON.stringify(customerResult, null, 2));

      if (!customerResponse.ok) {
        console.error('Customer creation failed:', customerResult);
        return new Response(JSON.stringify({ 
          error: `Failed to create customer in QuickBooks: ${customerResult.fault?.error?.[0]?.detail || 'Unknown error'}` 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const qbCustomerId = customerResult.QueryResponse?.Customer?.[0]?.Id || customerResult.customer?.Id;
      console.log('Customer created with ID:', qbCustomerId);

      // Now create the invoice
      const invoice = {
        customerRef: {
          value: qbCustomerId,
        },
        txnDate: serviceRecord.service_date,
        line: [
          {
            amount: 100, // Default service amount
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

      console.log('Invoice creation response status:', invoiceResponse.status);
      const invoiceResult = await invoiceResponse.json();

      if (!invoiceResponse.ok) {
        console.error('Invoice creation failed:', invoiceResult);
        return new Response(JSON.stringify({ 
          error: `Failed to create invoice in QuickBooks: ${invoiceResult.fault?.error?.[0]?.detail || 'Unknown error'}` 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const qbInvoiceId = invoiceResult.QueryResponse?.Invoice?.[0]?.Id || invoiceResult.invoice?.Id;
      console.log('Invoice created with ID:', qbInvoiceId);

      // Update sync status in database
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
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuickBooksCustomer {
  name: string;
  companyName?: string;
  contactInfo?: {
    emailAddr?: {
      address: string;
    };
    telephoneNumber?: {
      freeFormNumber: string;
    };
  };
  billAddr?: {
    line1?: string;
    city?: string;
    countrySubDivisionCode?: string;
    postalCode?: string;
  };
}

interface QuickBooksInvoice {
  customerRef: {
    value: string;
  };
  line: Array<{
    amount: number;
    detailType: "SalesItemLineDetail";
    salesItemLineDetail: {
      itemRef: {
        value: string;
        name: string;
      };
      qty?: number;
      unitPrice?: number;
      taxCodeRef?: {
        value: string;
      };
    };
  }>;
  dueDate?: string;
  txnDate: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from auth
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, data } = await req.json();

    // Actions that don't require an existing connection
    if (action === 'get_oauth_url' || action === 'oauth_callback') {
      switch (action) {
        case 'get_oauth_url': {
          const { redirect_uri } = data;
          
          // Get credentials and trim any whitespace
          let clientId = Deno.env.get('QUICKBOOKS_CLIENT_ID');
          let clientSecret = Deno.env.get('QUICKBOOKS_CLIENT_SECRET');
          
          if (clientId) clientId = clientId.trim();
          if (clientSecret) clientSecret = clientSecret.trim();
          
          console.log('Client ID (trimmed):', JSON.stringify(clientId));
          console.log('Client ID length:', clientId?.length);
          
          if (!clientId || !clientSecret) {
            throw new Error('QuickBooks credentials not configured');
          }

          const redirectUri = encodeURIComponent(redirect_uri);
          const scope = encodeURIComponent('com.intuit.quickbooks.accounting');
          const state = Math.random().toString(36).substring(7);
          
          const authUrl = `https://appcenter.intuit.com/connect/oauth2?client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}&response_type=code&access_type=offline&state=${state}`;
          
          console.log('Generated auth URL:', authUrl);

          return new Response(JSON.stringify({ 
            success: true, 
            oauth_url: authUrl 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        case 'oauth_callback': {
          const { code, realmId, redirect_uri } = data;
          
          let clientId = Deno.env.get('QUICKBOOKS_CLIENT_ID');
          let clientSecret = Deno.env.get('QUICKBOOKS_CLIENT_SECRET');
          
          if (clientId) clientId = clientId.trim();
          if (clientSecret) clientSecret = clientSecret.trim();
          
          if (!clientId || !clientSecret) {
            throw new Error('QuickBooks credentials not configured');
          }

          // Exchange code for tokens
          const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
            },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code: code,
              redirect_uri: redirect_uri, // Use the same redirect_uri that was used in the auth URL
            }),
          });

          const tokens = await tokenResponse.json();
          
          if (!tokenResponse.ok) {
            throw new Error(`OAuth error: ${tokens.error_description || 'Unknown error'}`);
          }

          // Store connection
          await supabaseClient
            .from('quickbooks_connections')
            .upsert({
              user_id: user.id,
              company_id: realmId,
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
              token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
              is_active: true,
            });

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // Get QuickBooks connection for actions that require it
    const { data: connection, error: connError } = await supabaseClient
      .from('quickbooks_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (connError || !connection) {
      return new Response(JSON.stringify({ 
        error: 'QuickBooks connection not found. Please connect to QuickBooks first.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const quickbooksBaseUrl = `https://sandbox-quickbooks.api.intuit.com/v3/company/${connection.company_id}`;
    const authHeaders = {
      'Authorization': `Bearer ${connection.access_token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    switch (action) {
      case 'sync_customer': {
        const { customer_id } = data;
        
        // Get customer data
        const { data: customer, error: customerError } = await supabaseClient
          .from('customers')
          .select('*')
          .eq('id', customer_id)
          .single();

        if (customerError || !customer) {
          throw new Error('Customer not found');
        }

        // Check if already synced
        const { data: existingSync } = await supabaseClient
          .from('quickbooks_customer_sync')
          .select('*')
          .eq('customer_id', customer_id)
          .eq('sync_status', 'synced')
          .maybeSingle();

        if (existingSync) {
          return new Response(JSON.stringify({ 
            success: true, 
            quickbooks_customer_id: existingSync.quickbooks_customer_id 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Create customer in QuickBooks
        const qbCustomer: QuickBooksCustomer = {
          name: `${customer.first_name} ${customer.last_name}`,
          companyName: customer.company || undefined,
        };

        if (customer.email) {
          qbCustomer.contactInfo = {
            emailAddr: { address: customer.email }
          };
        }

        if (customer.phone) {
          qbCustomer.contactInfo = {
            ...qbCustomer.contactInfo,
            telephoneNumber: { freeFormNumber: customer.phone }
          };
        }

        if (customer.address) {
          qbCustomer.billAddr = {
            line1: customer.address,
            city: customer.city || undefined,
            countrySubDivisionCode: customer.state || undefined,
            postalCode: customer.zip_code || undefined,
          };
        }

        const response = await fetch(`${quickbooksBaseUrl}/customer`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ customer: qbCustomer }),
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(`QuickBooks API error: ${result.fault?.error?.[0]?.detail || 'Unknown error'}`);
        }

        const qbCustomerId = result.QueryResponse?.Customer?.[0]?.Id || result.customer?.Id;

        // Update sync status
        await supabaseClient
          .from('quickbooks_customer_sync')
          .upsert({
            user_id: user.id,
            customer_id: customer_id,
            quickbooks_customer_id: qbCustomerId,
            sync_status: 'synced',
            last_synced_at: new Date().toISOString(),
          });

        return new Response(JSON.stringify({ 
          success: true, 
          quickbooks_customer_id: qbCustomerId 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'sync_invoice': {
        const { service_record_id } = data;
        console.log('Starting invoice sync for service record:', service_record_id);
        
        // Get service record with customer data
        const { data: serviceRecord, error: serviceError } = await supabaseClient
          .from('service_records')
          .select(`
            *,
            customers (*)
          `)
          .eq('id', service_record_id)
          .single();

        if (serviceError || !serviceRecord) {
          console.error('Service record error:', serviceError);
          throw new Error(`Service record not found: ${serviceError?.message || 'Unknown error'}`);
        }

        // Ensure customer is synced first
        console.log('Syncing customer first for service record...');
        
        // Check if already synced
        const { data: existingSync } = await supabaseClient
          .from('quickbooks_customer_sync')
          .select('*')
          .eq('customer_id', serviceRecord.customer_id)
          .eq('sync_status', 'synced')
          .maybeSingle();

        let qbCustomerId: string;
        
        if (existingSync) {
          qbCustomerId = existingSync.quickbooks_customer_id;
          console.log('Customer already synced, using existing QB ID:', qbCustomerId);
        } else {
          // Sync customer to QuickBooks
          const qbCustomer: QuickBooksCustomer = {
            name: `${serviceRecord.customers.first_name} ${serviceRecord.customers.last_name}`,
            companyName: serviceRecord.customers.company || undefined,
          };

          if (serviceRecord.customers.email) {
            qbCustomer.contactInfo = {
              emailAddr: { address: serviceRecord.customers.email }
            };
          }

          if (serviceRecord.customers.phone) {
            qbCustomer.contactInfo = {
              ...qbCustomer.contactInfo,
              telephoneNumber: { freeFormNumber: serviceRecord.customers.phone }
            };
          }

          if (serviceRecord.customers.address) {
            qbCustomer.billAddr = {
              line1: serviceRecord.customers.address,
              city: serviceRecord.customers.city || undefined,
              countrySubDivisionCode: serviceRecord.customers.state || undefined,
              postalCode: serviceRecord.customers.zip_code || undefined,
            };
          }

          console.log('Creating customer in QuickBooks...');
          console.log('QuickBooks base URL:', quickbooksBaseUrl);
          console.log('Customer data:', JSON.stringify(qbCustomer, null, 2));
          console.log('Auth headers:', { ...authHeaders, 'Authorization': '[REDACTED]' });
          
          const customerResponse = await fetch(`${quickbooksBaseUrl}/customer`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ customer: qbCustomer }),
          });

          console.log('Customer API response status:', customerResponse.status);
          console.log('Customer API response headers:', Object.fromEntries(customerResponse.headers.entries()));
          
          const customerResult = await customerResponse.json();
          console.log('Customer API response body:', JSON.stringify(customerResult, null, 2));
          
          if (!customerResponse.ok) {
            throw new Error(`QuickBooks customer API error: ${customerResult.fault?.error?.[0]?.detail || 'Unknown error'}`);
          }

          qbCustomerId = customerResult.QueryResponse?.Customer?.[0]?.Id || customerResult.customer?.Id;

          // Update sync status
          await supabaseClient
            .from('quickbooks_customer_sync')
            .upsert({
              user_id: user.id,
              customer_id: serviceRecord.customer_id,
              quickbooks_customer_id: qbCustomerId,
              sync_status: 'synced',
              last_synced_at: new Date().toISOString(),
            });
          
          console.log('Customer synced successfully, QB ID:', qbCustomerId);
        }

        // Create invoice in QuickBooks
        const invoice: QuickBooksInvoice = {
          customerRef: {
            value: qbCustomerId,
          },
          txnDate: serviceRecord.service_date,
          line: [
            {
              amount: 100, // Default service amount - you can customize this
              detailType: "SalesItemLineDetail",
              salesItemLineDetail: {
                itemRef: {
                  value: "HOURS", // Try using a standard item type
                  name: "Hours"
                },
                qty: 1,
                unitPrice: 100,
                taxCodeRef: {
                  value: "NON" // Non-taxable
                }
              },
            },
          ],
        };

        // Add parts as line items if available
        if (serviceRecord.parts_used && Array.isArray(serviceRecord.parts_used)) {
          for (const part of serviceRecord.parts_used) {
            if (part.inventoryItemId && part.quantity > 0) {
              // Get inventory item details
              const { data: inventoryItem } = await supabaseClient
                .from('inventory_items')
                .select('*')
                .eq('id', part.inventoryItemId)
                .maybeSingle();

              if (inventoryItem) {
                invoice.line.push({
                  amount: (inventoryItem.unit_price || 0) * part.quantity,
                  detailType: "SalesItemLineDetail",
                  salesItemLineDetail: {
                    itemRef: {
                      value: "HOURS", // Use standard item reference
                      name: inventoryItem.name || inventoryItem.description || "Pool Part",
                    },
                    qty: part.quantity,
                    unitPrice: inventoryItem.unit_price || 0,
                    taxCodeRef: {
                      value: "NON" // Non-taxable
                    }
                  },
                });
              }
            }
          }
        }

        console.log('Creating invoice in QuickBooks:', JSON.stringify(invoice, null, 2));
        
        const response = await fetch(`${quickbooksBaseUrl}/invoice`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ invoice }),
        });

        const result = await response.json();
        
        console.log('QuickBooks API response status:', response.status);
        console.log('QuickBooks API response:', JSON.stringify(result, null, 2));
        
        if (!response.ok) {
          const errorDetail = result.fault?.error?.[0]?.detail || result.Fault?.Error?.[0]?.Detail || JSON.stringify(result);
          console.error('QuickBooks API error:', errorDetail);
          throw new Error(`QuickBooks API error: ${errorDetail}`);
        }

        const qbInvoiceId = result.QueryResponse?.Invoice?.[0]?.Id || result.invoice?.Id;
        console.log('Extracted QB Invoice ID:', qbInvoiceId);

        // Update sync status
        await supabaseClient
          .from('quickbooks_invoice_sync')
          .upsert({
            user_id: user.id,
            service_record_id: service_record_id,
            quickbooks_invoice_id: qbInvoiceId,
            sync_status: 'synced',
            last_synced_at: new Date().toISOString(),
          });

        return new Response(JSON.stringify({ 
          success: true, 
          quickbooks_invoice_id: qbInvoiceId 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('QuickBooks integration error details:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: error.stack || 'No stack trace available'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
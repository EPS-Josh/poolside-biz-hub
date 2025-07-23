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
        
        if (!tokenResponse.ok || tokenData.error) {
          console.error('Token exchange error:', tokenData);
          throw new Error(`Token exchange failed: ${JSON.stringify(tokenData)}`);
        }

        console.log('Token exchange successful');

        // Store tokens in database
        const { error: dbError } = await supabaseClient
          .from('quickbooks_connections')
          .upsert({
            user_id: user.id,
            company_id: realmId,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
            is_active: true,
          });

        if (dbError) {
          console.error('Database error:', dbError);
          throw new Error(`Database error: ${dbError.message}`);
        }

        return new Response(JSON.stringify({ 
          success: true,
          message: 'QuickBooks connected successfully' 
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

    // Handle invoice sync
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
          customers (
            first_name,
            last_name,
            email,
            phone,
            company,
            address,
            city,
            state,
            zip_code
          )
        `)
        .eq('id', data.service_record_id)
        .single();

      if (serviceError || !serviceRecord) {
        return new Response(JSON.stringify({ 
          error: 'Service record not found' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Service record found for customer:', serviceRecord.customers.first_name, serviceRecord.customers.last_name);

      // Function to refresh QuickBooks token
      const refreshQuickBooksToken = async () => {
        console.log('Refreshing QuickBooks token...');
        
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

      let accessToken = connection.access_token;
      const quickbooksBaseUrl = `https://quickbooks.api.intuit.com/v3/company/${connection.company_id}`;
      
      const getAuthHeaders = () => ({
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      });

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

      // Search for existing customer
      console.log('Searching for existing customer...');
      const customerName = `${serviceRecord.customers.first_name} ${serviceRecord.customers.last_name}`.trim();
      console.log('Customer name:', customerName);
      
      // Sanitize customer name for QuickBooks
      const sanitizedCustomerName = customerName
        .replace(/[^\w\s&.-]/g, '') // Remove problematic characters
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim()
        .substring(0, 100); // Limit length

      const existingCustomerResponse = await makeQBRequest(
        `${quickbooksBaseUrl}/customer?query=Name='${encodeURIComponent(sanitizedCustomerName)}'`,
        { method: 'GET' }
      );

      let qbCustomerId = null;
      if (existingCustomerResponse.ok) {
        const existingCustomerData = await existingCustomerResponse.json();
        const customers = existingCustomerData.QueryResponse?.Customer || [];
        if (customers.length > 0) {
          qbCustomerId = customers[0].Id;
          console.log('Found existing customer with ID:', qbCustomerId);
        }
      }
      
      // Create customer if not found
      if (!qbCustomerId) {
        console.log('Creating customer in QuickBooks...');
        
        const qbCustomer: any = {
          Name: sanitizedCustomerName,
        };
        
        if (serviceRecord.customers.company?.trim()) {
          qbCustomer.CompanyName = serviceRecord.customers.company.trim();
        }

        const customerResponse = await makeQBRequest(
          `${quickbooksBaseUrl}/customer`,
          {
            method: 'POST',
            body: JSON.stringify(qbCustomer),
          }
        );

        const customerResponseStatus = customerResponse.status;
        console.log('Customer response status:', customerResponseStatus);

        const customerResult = await customerResponse.json();
        console.log('Customer response:', JSON.stringify(customerResult, null, 2));

        if (!customerResponse.ok) {
          console.log('Customer creation failed');
          return new Response(JSON.stringify({ 
            error: 'Failed to create customer in QuickBooks',
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
      const invoiceData = {
        CustomerRef: {
          value: qbCustomerId
        },
        Line: [
          {
            Amount: 100.00,
            DetailType: "SalesItemLineDetail",
            SalesItemLineDetail: {
              ItemRef: {
                value: "1"
              },
              UnitPrice: 100.00
            }
          }
        ],
        TotalAmt: 100.00
      };

      const invoiceResponse = await makeQBRequest(
        `${quickbooksBaseUrl}/invoice`,
        {
          method: 'POST',
          body: JSON.stringify(invoiceData),
        }
      );

      if (!invoiceResponse.ok) {
        const errorText = await invoiceResponse.text();
        console.error('Invoice creation failed:', errorText);
        return new Response(JSON.stringify({ 
          error: 'Failed to create invoice in QuickBooks',
          details: errorText
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const invoiceResult = await invoiceResponse.json();
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

    // Handle fetching invoices from QuickBooks
    if (action === 'fetch_invoices') {
      console.log('=== FETCH INVOICES FROM QB ===');
      
      try {
        // Get QuickBooks connection
        const { data: connection, error: connError } = await supabaseClient
          .from('quickbooks_connections')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        console.log('Connection query result:', { connection: !!connection, error: connError });

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

        // Function to refresh QuickBooks token
        const refreshQuickBooksToken = async () => {
          console.log('Refreshing QuickBooks token...');
          
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

        let accessToken = connection.access_token;
        const quickbooksBaseUrl = `https://quickbooks.api.intuit.com/v3/company/${connection.company_id}`;
        
        const getAuthHeaders = () => ({
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        });

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

        // Fetch recent invoices from QuickBooks
        console.log('Fetching invoices from QuickBooks...');
        const invoicesResponse = await makeQBRequest(
          `${quickbooksBaseUrl}/query?query=SELECT * FROM Invoice MAXRESULTS 50`,
          {
            method: 'GET',
          }
        );

        if (!invoicesResponse.ok) {
          const errorText = await invoicesResponse.text();
          console.error('Failed to fetch invoices:', errorText);
          throw new Error(`Failed to fetch invoices: ${errorText}`);
        }

        const invoicesResult = await invoicesResponse.json();
        console.log('Invoices fetched successfully');

        const invoices = invoicesResult.QueryResponse?.Invoice || [];
        
        return new Response(JSON.stringify({ 
          success: true,
          invoices: invoices.map((invoice: any) => ({
            id: invoice.Id,
            doc_number: invoice.DocNumber,
            txn_date: invoice.TxnDate,
            total_amt: invoice.TotalAmt,
            customer_ref: invoice.CustomerRef,
            line: invoice.Line || [],
            balance: invoice.Balance || 0,
            printed_status: invoice.PrintStatus,
            email_status: invoice.EmailStatus,
            created_time: invoice.MetaData?.CreateTime,
            last_updated_time: invoice.MetaData?.LastUpdatedTime
          }))
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (error) {
        console.error('Error fetching invoices:', error);
        return new Response(JSON.stringify({ 
          error: error.message || 'Failed to fetch invoices from QuickBooks'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Handle profit and loss data
    if (action === 'fetch_profit_loss') {
      console.log('=== FETCH PROFIT AND LOSS DATA ===');
      
      try {
        const { data: connection, error: connError } = await supabaseClient
          .from('quickbooks_connections')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        console.log('Connection query result:', { connection: !!connection, error: connError });

        if (connError || !connection) {
          return new Response(JSON.stringify({ error: 'No active QuickBooks connection found' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          });
        }

        console.log('QB connection found, company ID:', connection.company_id);
        console.log('Fetching profit and loss data from QuickBooks...');

        // Function to refresh QuickBooks token
        const refreshQuickBooksToken = async () => {
          console.log('Refreshing QuickBooks token...');
          
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

        let accessToken = connection.access_token;
        const quickbooksBaseUrl = `https://quickbooks.api.intuit.com/v3/company/${connection.company_id}`;
        
        const getAuthHeaders = () => ({
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'intuit_tid': crypto.randomUUID(),
        });

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

        // Get current date and calculate date range for this month and last month
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        
        // Calculate last month
        const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

        // Format dates for QuickBooks API (YYYY-MM-DD)
        const currentMonthStart = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
        const lastMonthStart = `${lastMonthYear}-${lastMonth.toString().padStart(2, '0')}-01`;
        const lastMonthEnd = new Date(currentYear, currentMonth - 1, 0).toISOString().split('T')[0];
        const currentMonthEnd = currentDate.toISOString().split('T')[0];

        console.log('Date ranges - Current:', currentMonthStart, 'to', currentMonthEnd);
        console.log('Date ranges - Last:', lastMonthStart, 'to', lastMonthEnd);

        // Try to fetch current month P&L report using the reports API
        const currentMonthPLUrl = `${quickbooksBaseUrl}/reports/ProfitAndLoss?start_date=${currentMonthStart}&end_date=${currentMonthEnd}`;
        console.log('Fetching current month P&L from:', currentMonthPLUrl);
        
        const currentMonthResponse = await makeQBRequest(currentMonthPLUrl, { method: 'GET' });

        if (!currentMonthResponse.ok) {
          const errorText = await currentMonthResponse.text();
          console.error('QB API Error - Current month P&L:', currentMonthResponse.status, errorText);
          
          // Fallback: try to get revenue data from recent invoices
          console.log('P&L API failed, trying to get revenue from invoices...');
          const invoicesResponse = await makeQBRequest(
            `${quickbooksBaseUrl}/query?query=SELECT * FROM Invoice WHERE TxnDate >= '${currentMonthStart}' AND TxnDate <= '${currentMonthEnd}' MAXRESULTS 50`,
            { method: 'GET' }
          );

          if (invoicesResponse.ok) {
            const invoicesResult = await invoicesResponse.json();
            const currentInvoices = invoicesResult.QueryResponse?.Invoice || [];
            const currentRevenue = currentInvoices.reduce((total: number, invoice: any) => {
              return total + (parseFloat(invoice.TotalAmt) || 0);
            }, 0);

            console.log('Current month revenue from invoices:', currentRevenue);

            // Get last month invoices for comparison
            const lastMonthInvoicesResponse = await makeQBRequest(
              `${quickbooksBaseUrl}/query?query=SELECT * FROM Invoice WHERE TxnDate >= '${lastMonthStart}' AND TxnDate <= '${lastMonthEnd}' MAXRESULTS 50`,
              { method: 'GET' }
            );

            let lastMonthRevenue = 0;
            if (lastMonthInvoicesResponse.ok) {
              const lastMonthInvoicesResult = await lastMonthInvoicesResponse.json();
              const lastMonthInvoices = lastMonthInvoicesResult.QueryResponse?.Invoice || [];
              lastMonthRevenue = lastMonthInvoices.reduce((total: number, invoice: any) => {
                return total + (parseFloat(invoice.TotalAmt) || 0);
              }, 0);
            }

            console.log('Last month revenue from invoices:', lastMonthRevenue);

            // Calculate basic metrics from invoice data
            const revenueChange = lastMonthRevenue > 0 
              ? ((currentRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
              : 0;

            // Estimate profit margin (assuming 30% for now since we don't have expense data)
            const estimatedProfitMargin = 30;
            const currentGrossProfit = currentRevenue * (estimatedProfitMargin / 100);

            return new Response(JSON.stringify({
              currentRevenue: currentRevenue,
              currentGrossProfit: currentGrossProfit,
              currentProfitMargin: estimatedProfitMargin,
              revenueChange: revenueChange,
              profitChange: revenueChange, // Use revenue change as proxy
              marginChange: 0, // No change in estimated margin
              dataSource: 'invoices_fallback',
              note: 'Data calculated from invoices since P&L report access failed'
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            });
          }

          return new Response(JSON.stringify({ 
            error: 'Failed to fetch P&L data from QuickBooks',
            details: errorText
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          });
        }

        const currentMonthData = await currentMonthResponse.json();
        console.log('P&L report fetched successfully');
        console.log('P&L Report structure sample:', JSON.stringify(currentMonthData, null, 2).substring(0, 1000));

        // Parse P&L data with improved logic
        let currentRevenue = 0;
        let currentExpenses = 0;

        const reportRows = currentMonthData.QueryResponse?.Report?.Rows || [];
        console.log('Number of report rows:', reportRows.length);

        // Function to recursively search through P&L rows
        const extractFinancialData = (rows: any[], depth = 0) => {
          let revenue = 0;
          let expenses = 0;
          
          for (const row of rows) {
            if (row.ColData && row.ColData[0]?.value) {
              const rowName = row.ColData[0].value.toLowerCase();
              const rowValue = row.ColData[1]?.value;
              
              console.log(`${' '.repeat(depth * 2)}Row: "${rowName}" = "${rowValue}"`);
              
              // Look for various revenue indicators
              if (rowName.includes('total income') || 
                  rowName.includes('gross receipts') ||
                  rowName.includes('sales') ||
                  rowName.includes('revenue') ||
                  rowName.includes('service revenue') ||
                  rowName.includes('income')) {
                const value = parseFloat(rowValue?.replace(/[,$]/g, '') || '0');
                if (value > revenue) {
                  revenue = value;
                  console.log(`Found revenue: ${revenue} from "${rowName}"`);
                }
              }
              
              // Look for expense indicators
              if (rowName.includes('total expenses') || 
                  rowName.includes('total operating expenses') ||
                  rowName.includes('expenses')) {
                const value = parseFloat(rowValue?.replace(/[,$]/g, '') || '0');
                if (value > expenses) {
                  expenses = value;
                  console.log(`Found expenses: ${expenses} from "${rowName}"`);
                }
              }
            }
            
            // Recursively search sub-rows
            if (row.Rows && Array.isArray(row.Rows)) {
              const subData = extractFinancialData(row.Rows, depth + 1);
              if (subData.revenue > revenue) revenue = subData.revenue;
              if (subData.expenses > expenses) expenses = subData.expenses;
            }
          }
          
          return { revenue, expenses };
        };

        const extracted = extractFinancialData(reportRows);
        currentRevenue = extracted.revenue;
        currentExpenses = extracted.expenses;

        console.log('Final extracted values - Revenue:', currentRevenue, 'Expenses:', currentExpenses);

        // If we still don't have revenue data, try the invoice fallback
        if (currentRevenue === 0) {
          console.log('No revenue found in P&L, falling back to invoice data...');
          const invoicesResponse = await makeQBRequest(
            `${quickbooksBaseUrl}/query?query=SELECT * FROM Invoice WHERE TxnDate >= '${currentMonthStart}' AND TxnDate <= '${currentMonthEnd}' MAXRESULTS 50`,
            { method: 'GET' }
          );

          if (invoicesResponse.ok) {
            const invoicesResult = await invoicesResponse.json();
            const currentInvoices = invoicesResult.QueryResponse?.Invoice || [];
            currentRevenue = currentInvoices.reduce((total: number, invoice: any) => {
              return total + (parseFloat(invoice.TotalAmt) || 0);
            }, 0);
            console.log('Revenue from invoices fallback:', currentRevenue);
          }
        }

        const currentGrossProfit = currentRevenue - currentExpenses;
        const currentProfitMargin = currentRevenue > 0 ? (currentGrossProfit / currentRevenue) * 100 : 0;

        // For now, we'll return current month data with estimated changes
        return new Response(JSON.stringify({
          currentRevenue: currentRevenue,
          currentGrossProfit: currentGrossProfit,
          currentProfitMargin: currentProfitMargin,
          revenueChange: 0, // Would need last month data for accurate comparison
          profitChange: 0,
          marginChange: 0,
          dataSource: 'quickbooks_pl_report'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      } catch (error) {
        console.error('Error fetching P&L data:', error);
        return new Response(JSON.stringify({ 
          error: 'Failed to fetch P&L data',
          details: error.message
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }
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
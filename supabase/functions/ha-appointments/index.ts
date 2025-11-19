import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.9";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { date, user_id } = await req.json();
    
    console.log('Request received:', { date, user_id });
    
    if (!user_id) {
      console.error('Missing user_id in request');
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user can only access their own appointments (unless admin)
    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some(r => r.role === 'admin') || false;

    if (!isAdmin && user.id !== user_id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: You can only access your own appointments' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Fetching appointments for user ${user_id} on date: ${date}`);

    const { data: appointments, error } = await supabaseClient
      .from('appointments')
      .select(`
        *,
        customers!customer_id (
          first_name,
          last_name,
          address,
          city,
          state,
          zip_code
        )
      `)
      .eq('appointment_date', date)
      .eq('user_id', user_id)
      .order('appointment_time');

    if (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }

    console.log(`Found ${appointments?.length || 0} appointments for user ${user_id} on ${date}`);

    return new Response(
      JSON.stringify({ appointments: appointments || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ha-appointments function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

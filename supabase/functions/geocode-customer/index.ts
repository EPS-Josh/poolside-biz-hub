import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.9"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GeocodeRequest {
  customerId: string;
  address: string;
  city: string;
  state: string;
  zipCode?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mapboxToken = Deno.env.get('MAPBOX_TOKEN');
    if (!mapboxToken) {
      return new Response(
        JSON.stringify({ error: 'Mapbox token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { customerId, address, city, state, zipCode }: GeocodeRequest = await req.json();

    if (!customerId || !address || !city || !state) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build full address for geocoding
    const fullAddress = `${address}, ${city}, ${state} ${zipCode || ''}`.trim();
    
    console.log(`Geocoding address for customer ${customerId}: ${fullAddress}`);

    // Call Mapbox Geocoding API
    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=${mapboxToken}&country=US&proximity=-110.8,32.2`;
    
    const response = await fetch(geocodeUrl);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const [longitude, latitude] = data.features[0].center;
      
      console.log(`Geocoded coordinates: ${latitude}, ${longitude}`);

      // Update customer with geocoded coordinates
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          latitude,
          longitude,
          geocoded_at: new Date().toISOString()
        })
        .eq('id', customerId);

      if (updateError) {
        console.error('Error updating customer coordinates:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update customer coordinates' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          latitude, 
          longitude,
          address: fullAddress
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.log(`No geocoding results found for: ${fullAddress}`);
      
      // Still update geocoded_at to mark as attempted
      await supabase
        .from('customers')
        .update({ geocoded_at: new Date().toISOString() })
        .eq('id', customerId);

      return new Response(
        JSON.stringify({ 
          error: 'Address not found',
          address: fullAddress
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
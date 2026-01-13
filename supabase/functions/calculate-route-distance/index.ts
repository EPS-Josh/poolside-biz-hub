import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Coordinate {
  lat: number;
  lng: number;
}

interface RouteStop {
  name: string;
  coordinate: Coordinate;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mapboxToken = Deno.env.get('MAPBOX_TOKEN');
    
    if (!mapboxToken) {
      console.error('Mapbox token not configured');
      return new Response(
        JSON.stringify({ error: 'Mapbox token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    
    // Support both 'stops' format and 'coordinates' format
    let stops: RouteStop[];
    
    if (body.stops) {
      stops = body.stops;
    } else if (body.coordinates) {
      // Convert coordinates format to stops format
      stops = body.coordinates.map((coord: any, index: number) => ({
        name: `Stop ${index + 1}`,
        coordinate: {
          lat: coord.latitude || coord.lat,
          lng: coord.longitude || coord.lng
        }
      }));
    } else {
      return new Response(
        JSON.stringify({ error: 'Either stops or coordinates are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!stops || stops.length < 2) {
      return new Response(
        JSON.stringify({ error: 'At least 2 stops are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const optimize = body.optimize === true;

    console.log(`Calculating route for ${stops.length} stops${optimize ? ' with optimization' : ''}`);

    // Build coordinates string for Mapbox API
    const coordinates = stops
      .map((stop: RouteStop) => `${stop.coordinate.lng},${stop.coordinate.lat}`)
      .join(';');

    // Call Mapbox Optimization API if optimize is true, otherwise use Directions API
    let apiUrl: string;
    if (optimize) {
      // Use Optimization API for route optimization
      apiUrl = `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coordinates}?access_token=${mapboxToken}&source=first&destination=last&roundtrip=false`;
    } else {
      // Use Directions API for simple route calculation
      apiUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?access_token=${mapboxToken}&overview=false&steps=false`;
    }
    
    console.log('Calling Mapbox API...');
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mapbox API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to calculate route', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Handle optimization response
    if (optimize) {
      if (!data.trips || data.trips.length === 0) {
        console.error('No optimized route found');
        return new Response(
          JSON.stringify({ error: 'No optimized route found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const trip = data.trips[0];
      const distanceMeters = trip.distance;
      const distanceMiles = distanceMeters / 1609.344;
      const durationSeconds = trip.duration;

      // Get the optimized waypoint order
      const optimizedOrder = data.waypoints
        .map((wp: any) => wp.waypoint_index)
        .filter((idx: number) => idx !== undefined);

      console.log(`Optimized route: ${distanceMiles.toFixed(2)} miles, order: ${optimizedOrder.join(' -> ')}`);

      return new Response(
        JSON.stringify({
          totalDistance: distanceMiles,
          totalDistanceMiles: distanceMiles,
          totalDuration: durationSeconds,
          totalDurationMinutes: durationSeconds / 60,
          optimizedOrder,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Handle regular directions response
    if (!data.routes || data.routes.length === 0) {
      console.error('No routes found');
      return new Response(
        JSON.stringify({ error: 'No route found between the specified locations' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const route = data.routes[0];
    const distanceMeters = route.distance;
    const distanceMiles = distanceMeters / 1609.344;
    const durationSeconds = route.duration;

    // Get individual leg distances
    const legs = route.legs?.map((leg: any, index: number) => ({
      from: stops[index].name,
      to: stops[index + 1].name,
      distanceMiles: leg.distance / 1609.344,
      durationMinutes: leg.duration / 60,
    })) || [];

    console.log(`Route calculated: ${distanceMiles.toFixed(2)} miles total`);

    return new Response(
      JSON.stringify({
        totalDistance: distanceMiles,
        totalDistanceMiles: distanceMiles,
        totalDuration: durationSeconds,
        totalDurationMinutes: durationSeconds / 60,
        legs,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error calculating route:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

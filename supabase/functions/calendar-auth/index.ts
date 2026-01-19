import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate HMAC signature for OAuth state
async function generateStateSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  return base64Encode(new Uint8Array(signature));
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { provider } = await req.json()
    
    console.log('Starting OAuth flow for provider:', provider)

    const authHeaders = req.headers.get('Authorization')
    if (!authHeaders) {
      throw new Error('No authorization header')
    }

    const token = authHeaders.replace('Bearer ', '')
    
    // Create authenticated client to verify user
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )
    
    const { data: { user }, error: userError } = await authClient.auth.getUser()
    
    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    // Generate timestamp for state freshness
    const timestamp = Date.now()
    
    // Create state payload with user ID and timestamp
    const statePayload = `${provider}:${user.id}:${timestamp}`
    
    // Get the OAuth state signing secret (use service role key as signing secret)
    // In production, you might want a dedicated secret for this
    const signingSecret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!signingSecret) {
      throw new Error('Signing secret not configured')
    }
    
    // Generate HMAC signature
    const signature = await generateStateSignature(statePayload, signingSecret)
    
    // Combine payload and signature (URL-safe base64)
    const signedState = `${statePayload}:${signature.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`
    
    console.log('Generated signed state for user:', user.id)

    let authUrl = ''
    const redirectUri = 'https://fsqztictdjcguzchlcdf.supabase.co/functions/v1/calendar-auth-callback'

    if (provider === 'google') {
      const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID')
      if (!googleClientId) {
        throw new Error('Google client ID not configured')
      }

      const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ].join(' ')

      const params = new URLSearchParams({
        client_id: googleClientId,
        redirect_uri: redirectUri,
        scope: scopes,
        response_type: 'code',
        access_type: 'offline',
        prompt: 'consent',
        state: signedState
      })

      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    
    } else if (provider === 'microsoft') {
      const microsoftClientId = Deno.env.get('MICROSOFT_CLIENT_ID')
      if (!microsoftClientId) {
        throw new Error('Microsoft client ID not configured')
      }

      const scopes = [
        'https://graph.microsoft.com/Calendars.ReadWrite',
        'https://graph.microsoft.com/User.Read',
        'offline_access'
      ].join(' ')

      const params = new URLSearchParams({
        client_id: microsoftClientId,
        redirect_uri: redirectUri,
        scope: scopes,
        response_type: 'code',
        response_mode: 'query',
        state: signedState
      })

      authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`
    }

    return new Response(
      JSON.stringify({ authUrl }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Calendar auth error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

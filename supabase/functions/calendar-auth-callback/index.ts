import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts"

// Maximum age for state parameter (5 minutes)
const STATE_MAX_AGE_MS = 5 * 60 * 1000;

// Generate HMAC signature for OAuth state verification
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

// Verify HMAC signature
async function verifyStateSignature(payload: string, providedSignature: string, secret: string): Promise<boolean> {
  const expectedSignature = await generateStateSignature(payload, secret);
  // Convert back from URL-safe base64
  const normalizedProvided = providedSignature.replace(/-/g, '+').replace(/_/g, '/');
  const normalizedExpected = expectedSignature.replace(/=+$/, '');
  return normalizedProvided === normalizedExpected || normalizedProvided + '=' === normalizedExpected || normalizedProvided + '==' === normalizedExpected;
}

serve(async (req) => {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    if (error) {
      console.error('OAuth error:', error)
      return Response.redirect('https://7f4b5ab0-60de-43fe-96cc-93f94d955704.lovableproject.com/calendar?error=oauth_error')
    }

    if (!code || !state) {
      throw new Error('Missing code or state parameter')
    }

    // Parse the signed state: format is "provider:userId:timestamp:signature"
    const stateParts = state.split(':')
    if (stateParts.length !== 4) {
      console.error('Invalid state format: expected 4 parts, got', stateParts.length)
      return Response.redirect('https://7f4b5ab0-60de-43fe-96cc-93f94d955704.lovableproject.com/calendar?error=invalid_state')
    }

    const [provider, userId, timestampStr, providedSignature] = stateParts
    const timestamp = parseInt(timestampStr, 10)

    // Validate timestamp is not too old (prevent replay attacks)
    const now = Date.now()
    if (isNaN(timestamp) || now - timestamp > STATE_MAX_AGE_MS) {
      console.error('State expired or invalid timestamp')
      return Response.redirect('https://7f4b5ab0-60de-43fe-96cc-93f94d955704.lovableproject.com/calendar?error=state_expired')
    }

    // Verify HMAC signature
    const signingSecret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!signingSecret) {
      throw new Error('Signing secret not configured')
    }

    const statePayload = `${provider}:${userId}:${timestampStr}`
    const isValidSignature = await verifyStateSignature(statePayload, providedSignature, signingSecret)
    
    if (!isValidSignature) {
      console.error('Invalid state signature')
      return Response.redirect('https://7f4b5ab0-60de-43fe-96cc-93f94d955704.lovableproject.com/calendar?error=invalid_signature')
    }

    console.log('Verified OAuth callback for provider:', provider, 'user:', userId)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const redirectUri = 'https://fsqztictdjcguzchlcdf.supabase.co/functions/v1/calendar-auth-callback'
    let tokenData

    if (provider === 'google') {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        })
      })

      tokenData = await tokenResponse.json()
    
    } else if (provider === 'microsoft') {
      const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get('MICROSOFT_CLIENT_ID') ?? '',
          client_secret: Deno.env.get('MICROSOFT_CLIENT_SECRET') ?? '',
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        })
      })

      tokenData = await tokenResponse.json()
    }

    if (!tokenData?.access_token) {
      console.error('Failed to get access token:', tokenData)
      throw new Error('Failed to get access token')
    }

    // Calculate token expiry
    const expiresAt = tokenData.expires_in 
      ? new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString()
      : null

    // Store integration in database
    const { error: dbError } = await supabase
      .from('calendar_integrations')
      .upsert({
        user_id: userId,
        provider,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        token_expires_at: expiresAt,
        is_active: true,
        last_sync_at: null
      }, {
        onConflict: 'user_id,provider'
      })

    if (dbError) {
      console.error('Database error:', dbError)
      throw dbError
    }

    console.log('Calendar integration saved successfully for user:', userId)
    return Response.redirect('https://7f4b5ab0-60de-43fe-96cc-93f94d955704.lovableproject.com/calendar?success=integration_added')

  } catch (error) {
    console.error('Callback error:', error)
    return Response.redirect('https://7f4b5ab0-60de-43fe-96cc-93f94d955704.lovableproject.com/calendar?error=callback_failed')
  }
})

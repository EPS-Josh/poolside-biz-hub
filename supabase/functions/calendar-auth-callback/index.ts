
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    const [provider, userId] = state.split(':')
    console.log('Processing callback for provider:', provider, 'user:', userId)

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

    if (!tokenData.access_token) {
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

    console.log('Calendar integration saved successfully')
    return Response.redirect('https://7f4b5ab0-60de-43fe-96cc-93f94d955704.lovableproject.com/calendar?success=integration_added')

  } catch (error) {
    console.error('Callback error:', error)
    return Response.redirect('https://7f4b5ab0-60de-43fe-96cc-93f94d955704.lovableproject.com/calendar?error=callback_failed')
  }
})

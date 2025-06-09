
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { provider } = await req.json()
    
    console.log('Starting OAuth flow for provider:', provider)

    const authHeaders = req.headers.get('Authorization')
    if (!authHeaders) {
      throw new Error('No authorization header')
    }

    const token = authHeaders.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    let authUrl = ''
    const redirectUri = 'https://7f4b5ab0-60de-43fe-96cc-93f94d955704.lovableproject.com/calendar'

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
        state: `${provider}:${user.id}`
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
        state: `${provider}:${user.id}`
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

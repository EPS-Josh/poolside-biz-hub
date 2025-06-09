
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeaders = req.headers.get('Authorization')
    if (!authHeaders) {
      throw new Error('No authorization header')
    }

    const token = authHeaders.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    // Get active integrations
    const { data: integrations } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (!integrations || integrations.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active integrations found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let syncResults = []

    for (const integration of integrations) {
      try {
        console.log('Syncing integration:', integration.provider)
        
        // Get appointments from database
        const { data: appointments } = await supabase
          .from('appointments')
          .select('*')
          .eq('user_id', user.id)
          .gte('appointment_date', new Date().toISOString().split('T')[0])

        if (integration.provider === 'google') {
          await syncGoogleCalendar(integration, appointments || [], supabase)
        } else if (integration.provider === 'microsoft') {
          await syncMicrosoftCalendar(integration, appointments || [], supabase)
        }

        // Update last sync time
        await supabase
          .from('calendar_integrations')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', integration.id)

        syncResults.push({
          provider: integration.provider,
          status: 'success',
          syncedAt: new Date().toISOString()
        })

      } catch (error) {
        console.error(`Sync error for ${integration.provider}:`, error)
        syncResults.push({
          provider: integration.provider,
          status: 'error',
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({ syncResults }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Calendar sync error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

async function syncGoogleCalendar(integration: any, appointments: any[], supabase: any) {
  const headers = {
    'Authorization': `Bearer ${integration.access_token}`,
    'Content-Type': 'application/json'
  }

  // Get Google Calendar events
  const eventsResponse = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?' +
    new URLSearchParams({
      timeMin: new Date().toISOString(),
      maxResults: '250',
      singleEvents: 'true',
      orderBy: 'startTime'
    }),
    { headers }
  )

  if (!eventsResponse.ok) {
    throw new Error(`Google API error: ${eventsResponse.status}`)
  }

  const eventsData = await eventsResponse.json()

  // Sync appointments to Google Calendar
  for (const appointment of appointments) {
    if (!appointment.external_event_id) {
      const startDateTime = `${appointment.appointment_date}T${appointment.appointment_time}:00`
      const endDateTime = new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000).toISOString()

      const event = {
        summary: `${appointment.service_type} - Pool Service`,
        description: appointment.notes || '',
        start: { dateTime: startDateTime },
        end: { dateTime: endDateTime }
      }

      const createResponse = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers,
          body: JSON.stringify(event)
        }
      )

      if (createResponse.ok) {
        const createdEvent = await createResponse.json()
        
        // Update appointment with external ID
        await supabase
          .from('appointments')
          .update({ external_event_id: createdEvent.id })
          .eq('id', appointment.id)

        console.log('Created Google Calendar event:', createdEvent.id)
      }
    }
  }
}

async function syncMicrosoftCalendar(integration: any, appointments: any[], supabase: any) {
  const headers = {
    'Authorization': `Bearer ${integration.access_token}`,
    'Content-Type': 'application/json'
  }

  // Get Microsoft Calendar events
  const eventsResponse = await fetch(
    'https://graph.microsoft.com/v1.0/me/calendar/events?' +
    new URLSearchParams({
      $filter: `start/dateTime ge '${new Date().toISOString()}'`,
      $top: '250',
      $orderby: 'start/dateTime'
    }),
    { headers }
  )

  if (!eventsResponse.ok) {
    throw new Error(`Microsoft Graph API error: ${eventsResponse.status}`)
  }

  const eventsData = await eventsResponse.json()

  // Sync appointments to Microsoft Calendar
  for (const appointment of appointments) {
    if (!appointment.external_event_id) {
      const startDateTime = `${appointment.appointment_date}T${appointment.appointment_time}:00`
      const endDateTime = new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000).toISOString()

      const event = {
        subject: `${appointment.service_type} - Pool Service`,
        body: {
          contentType: 'Text',
          content: appointment.notes || ''
        },
        start: {
          dateTime: startDateTime,
          timeZone: 'UTC'
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'UTC'
        }
      }

      const createResponse = await fetch(
        'https://graph.microsoft.com/v1.0/me/calendar/events',
        {
          method: 'POST',
          headers,
          body: JSON.stringify(event)
        }
      )

      if (createResponse.ok) {
        const createdEvent = await createResponse.json()
        
        // Update appointment with external ID
        await supabase
          .from('appointments')
          .update({ external_event_id: createdEvent.id })
          .eq('id', appointment.id)

        console.log('Created Microsoft Calendar event:', createdEvent.id)
      }
    }
  }
}

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssessorRecord {
  parcelNumber: string;
  ownerName: string;
  mailingAddress: string;
  propertyAddress: string;
  assessedValue: string;
  lastUpdated: string;
}

async function searchPimaAssessor(address: string): Promise<AssessorRecord | null> {
  try {
    console.log(`Searching Pima County Assessor for address: ${address}`);
    
    // Parse the address to extract street number and name
    const addressParts = address.trim().split(' ');
    if (addressParts.length < 2) {
      console.log('Invalid address format');
      return null;
    }

    const streetNumber = addressParts[0];
    const streetName = addressParts.slice(1).join(' ');
    
    console.log(`Street Number: ${streetNumber}, Street Name: ${streetName}`);

    // Create the search URL for Pima County Assessor
    const searchUrl = 'https://www.asr.pima.gov/search/CommercialResidential';
    
    // First, get the search page to extract any necessary form tokens
    const searchPageResponse = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive'
      }
    });

    if (!searchPageResponse.ok) {
      console.log(`Failed to fetch search page: ${searchPageResponse.status}`);
      return null;
    }

    const searchPageHtml = await searchPageResponse.text();
    console.log('Search page loaded successfully');

    // Try a direct search approach using GET parameters
    const searchParams = new URLSearchParams({
      'SearchType': 'Address',
      'StreetNumber': streetNumber,
      'StreetName': streetName,
      'City': 'TUCSON' // Default to Tucson since most addresses are there
    });

    const directSearchUrl = `${searchUrl}?${searchParams.toString()}`;
    console.log(`Trying direct search URL: ${directSearchUrl}`);

    const directSearchResponse = await fetch(directSearchUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': searchUrl,
        'Connection': 'keep-alive'
      }
    });

    if (!directSearchResponse.ok) {
      console.log(`Direct search request failed: ${directSearchResponse.status}`);
      return null;
    }

    const resultsHtml = await directSearchResponse.text();
    console.log('Search results received');
    
    // Log a portion of the HTML to debug
    console.log('HTML snippet (first 1000 chars):', resultsHtml.substring(0, 1000));
    console.log('HTML snippet (looking for table data):', 
      resultsHtml.substring(resultsHtml.indexOf('<table'), resultsHtml.indexOf('</table>') + 8));

    // Parse the HTML results
    const record = parseAssessorResults(resultsHtml, address);
    
    if (record) {
      console.log('Successfully parsed assessor record:', record);
    } else {
      console.log('No property found in search results');
      
      // Log more details about what we found
      if (resultsHtml.includes('No records found') || resultsHtml.includes('no results')) {
        console.log('Website returned "no results" message');
      } else if (resultsHtml.includes('error') || resultsHtml.includes('Error')) {
        console.log('Website returned an error');
      } else {
        console.log('Results returned but parsing failed');
      }
    }

    return record;

  } catch (error) {
    console.error('Error searching Pima County Assessor:', error);
    return null;
  }
}

function parseAssessorResults(html: string, searchAddress: string): AssessorRecord | null {
  try {
    console.log('Starting HTML parsing...');
    
    // Look for common patterns in Pima County Assessor results
    
    // Method 1: Look for table rows with property data
    const tableRowPattern = /<tr[^>]*>(.*?)<\/tr>/gis;
    const tableRows = html.match(tableRowPattern) || [];
    
    console.log(`Found ${tableRows.length} table rows`);
    
    let parcelNumber = '';
    let ownerName = '';
    let propertyAddress = '';
    let assessedValue = '';
    
    // Try to find data in table structure
    for (const row of tableRows) {
      // Look for parcel number patterns
      const parcelMatches = [
        /parcel[^>]*>([^<]+)</i,
        /(\d{3}-\d{2}-\d{3}[A-Z]?)/,
        /APN[^>]*>([^<]+)</i
      ];
      
      for (const pattern of parcelMatches) {
        const match = row.match(pattern);
        if (match && match[1] && !parcelNumber) {
          parcelNumber = match[1].trim();
          console.log('Found parcel number:', parcelNumber);
          break;
        }
      }
      
      // Look for owner name patterns
      const ownerMatches = [
        /owner[^>]*>([^<]+)</i,
        /<td[^>]*>([A-Z][A-Z\s,&]{10,})<\/td>/,
        /name[^>]*>([^<]+)</i
      ];
      
      for (const pattern of ownerMatches) {
        const match = row.match(pattern);
        if (match && match[1] && !ownerName) {
          const candidate = match[1].trim();
          // Filter out obvious non-names
          if (candidate.length > 5 && !candidate.includes('$') && !candidate.includes('http')) {
            ownerName = candidate;
            console.log('Found owner name:', ownerName);
            break;
          }
        }
      }
      
      // Look for address patterns
      const addressMatches = [
        /address[^>]*>([^<]+)</i,
        /(\d+\s+[NSEW]?\s*[A-Z\s]+)/i
      ];
      
      for (const pattern of addressMatches) {
        const match = row.match(pattern);
        if (match && match[1] && !propertyAddress) {
          propertyAddress = match[1].trim();
          console.log('Found property address:', propertyAddress);
          break;
        }
      }
      
      // Look for value patterns
      const valueMatches = [
        /value[^>]*>\$?([0-9,]+)</i,
        /\$([0-9,]+)/
      ];
      
      for (const pattern of valueMatches) {
        const match = row.match(pattern);
        if (match && match[1] && !assessedValue) {
          assessedValue = `$${match[1]}`;
          console.log('Found assessed value:', assessedValue);
          break;
        }
      }
    }
    
    // Method 2: Look for specific field patterns in the entire HTML
    if (!parcelNumber) {
      const parcelPatterns = [
        /Parcel\s*(?:Number|#|ID)?[:\s]*([0-9\-A-Z]+)/i,
        /APN[:\s]*([0-9\-A-Z]+)/i,
        /([0-9]{3}-[0-9]{2}-[0-9]{3}[A-Z]?)/
      ];
      
      for (const pattern of parcelPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          parcelNumber = match[1].trim();
          console.log('Found parcel number (method 2):', parcelNumber);
          break;
        }
      }
    }
    
    if (!ownerName) {
      const ownerPatterns = [
        /Owner[^:]*:[^<]*>([^<]+)</i,
        /Property\s*Owner[^:]*:[^<]*([^<\n]+)/i,
        /<b[^>]*>([A-Z][A-Z\s,&]{8,})<\/b>/
      ];
      
      for (const pattern of ownerPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const candidate = match[1].trim().replace(/&amp;/g, '&');
          if (candidate.length > 5 && !candidate.includes('$')) {
            ownerName = candidate;
            console.log('Found owner name (method 2):', ownerName);
            break;
          }
        }
      }
    }
    
    // Log final results
    console.log('Final parsing results:', {
      parcelNumber: parcelNumber || 'Not Found',
      ownerName: ownerName || 'Not Found',
      propertyAddress: propertyAddress || searchAddress,
      assessedValue: assessedValue || 'Not Available'
    });
    
    // If we found at least a parcel number or owner name, consider it a successful match
    if (parcelNumber || ownerName) {
      return {
        parcelNumber: parcelNumber || 'Not Found',
        ownerName: ownerName || 'Not Found',
        mailingAddress: propertyAddress || searchAddress,
        propertyAddress: propertyAddress || searchAddress,
        assessedValue: assessedValue || 'Not Available',
        lastUpdated: new Date().toISOString().split('T')[0]
      };
    }
    
    console.log('No property data found in HTML');
    return null;
    
  } catch (error) {
    console.error('Error parsing assessor results:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ============ AUTHENTICATION ============
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client with user's auth token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify the JWT and get user claims
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.log('Invalid JWT token:', claimsError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`Authenticated user: ${userId}`);

    // ============ AUTHORIZATION ============
    // Check if user has admin or manager role
    const { data: userRoles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify permissions' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const hasPermission = userRoles?.some(r => r.role === 'admin' || r.role === 'manager');
    if (!hasPermission) {
      console.log(`User ${userId} lacks required permissions. Roles:`, userRoles?.map(r => r.role));
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Admin or manager role required.' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`User ${userId} authorized with roles:`, userRoles?.map(r => r.role));

    // ============ RATE LIMITING ============
    // Use service role client for rate limiting (bypasses RLS)
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const rateLimitKey = `pima-lookup:${userId}`;
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

    // Check recent requests in the last hour
    const { data: recentRequests, error: rateLimitError } = await supabaseService
      .from('rate_limit_log')
      .select('request_count, window_start')
      .eq('identifier', rateLimitKey)
      .eq('endpoint', 'pima-assessor-lookup')
      .gte('window_start', oneHourAgo)
      .order('window_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
      // Continue anyway - don't block on rate limit errors
    }

    const MAX_REQUESTS_PER_HOUR = 20;
    const currentCount = recentRequests?.request_count || 0;

    if (currentCount >= MAX_REQUESTS_PER_HOUR) {
      console.log(`Rate limit exceeded for user ${userId}: ${currentCount} requests in the last hour`);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Maximum 20 requests per hour.',
          retryAfter: 3600 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '3600'
          } 
        }
      );
    }

    // Update rate limit counter
    if (recentRequests) {
      await supabaseService
        .from('rate_limit_log')
        .update({ 
          request_count: currentCount + 1,
          created_at: new Date().toISOString()
        })
        .eq('identifier', rateLimitKey)
        .eq('endpoint', 'pima-assessor-lookup')
        .eq('window_start', recentRequests.window_start);
    } else {
      await supabaseService
        .from('rate_limit_log')
        .insert({
          endpoint: 'pima-assessor-lookup',
          identifier: rateLimitKey,
          request_count: 1,
          window_start: new Date().toISOString()
        });
    }

    // ============ INPUT VALIDATION ============
    const body = await req.json();
    const { address } = body;

    if (!address || typeof address !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Valid address string is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Sanitize address input
    const sanitizedAddress = address.trim().replace(/[<>]/g, '');
    
    if (sanitizedAddress.length < 3 || sanitizedAddress.length > 200) {
      return new Response(
        JSON.stringify({ error: 'Address must be between 3 and 200 characters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Basic address format validation
    if (!/\d/.test(sanitizedAddress)) {
      return new Response(
        JSON.stringify({ error: 'Address must contain at least one number' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Processing lookup request for address: ${sanitizedAddress}`);

    // ============ AUDIT LOGGING ============
    await supabaseService
      .from('audit_logs')
      .insert({
        user_id: userId,
        action: 'pima_assessor_lookup',
        resource_type: 'external_api',
        new_values: { 
          address: sanitizedAddress,
          timestamp: new Date().toISOString()
        }
      });

    // ============ BUSINESS LOGIC ============
    const assessorRecord = await searchPimaAssessor(sanitizedAddress);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: assessorRecord,
        searchAddress: sanitizedAddress 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

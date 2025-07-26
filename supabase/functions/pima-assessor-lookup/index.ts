import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    const searchUrl = 'https://www.asr.pima.gov/search/';
    
    // First, get the search page to extract any necessary form tokens
    const searchPageResponse = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
      }
    });

    if (!searchPageResponse.ok) {
      console.log(`Failed to fetch search page: ${searchPageResponse.status}`);
      return null;
    }

    const searchPageHtml = await searchPageResponse.text();
    console.log('Search page loaded successfully');

    // Extract CSRF token or session data if needed
    const csrfMatch = searchPageHtml.match(/name="csrf_token"[^>]*value="([^"]+)"/);
    const csrfToken = csrfMatch ? csrfMatch[1] : '';

    // Prepare form data for the search
    const formData = new FormData();
    formData.append('search_type', 'address');
    formData.append('street_number', streetNumber);
    formData.append('street_name', streetName);
    if (csrfToken) {
      formData.append('csrf_token', csrfToken);
    }

    console.log('Submitting search form...');

    // Submit the search form
    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': searchUrl,
        'Connection': 'keep-alive'
      },
      body: formData
    });

    if (!searchResponse.ok) {
      console.log(`Search request failed: ${searchResponse.status}`);
      return null;
    }

    const resultsHtml = await searchResponse.text();
    console.log('Search results received');

    // Parse the HTML results
    const record = parseAssessorResults(resultsHtml, address);
    
    if (record) {
      console.log('Successfully parsed assessor record:', record);
    } else {
      console.log('No property found in search results');
    }

    return record;

  } catch (error) {
    console.error('Error searching Pima County Assessor:', error);
    return null;
  }
}

function parseAssessorResults(html: string, searchAddress: string): AssessorRecord | null {
  try {
    // Look for property data in the HTML
    // This is a simplified parser - in production, you'd want more robust HTML parsing
    
    // Extract parcel number
    const parcelMatch = html.match(/Parcel\s*[#:]?\s*([0-9\-A-Z]+)/i);
    const parcelNumber = parcelMatch ? parcelMatch[1] : '';

    // Extract owner name
    const ownerMatch = html.match(/Owner[^<]*:\s*([^<\n]+)/i) || 
                     html.match(/<td[^>]*>\s*([A-Z\s,&]+)\s*<\/td>/);
    let ownerName = ownerMatch ? ownerMatch[1].trim() : '';
    
    // Clean up owner name
    ownerName = ownerName.replace(/\s+/g, ' ').trim();

    // Extract property address
    const addressMatch = html.match(/Property\s*Address[^:]*:\s*([^<\n]+)/i) ||
                        html.match(/Address[^:]*:\s*([^<\n]+)/i);
    const propertyAddress = addressMatch ? addressMatch[1].trim() : searchAddress;

    // Extract mailing address (might be same as property address)
    const mailingMatch = html.match(/Mailing\s*Address[^:]*:\s*([^<\n]+)/i);
    const mailingAddress = mailingMatch ? mailingMatch[1].trim() : propertyAddress;

    // Extract assessed value
    const valueMatch = html.match(/Assessed\s*Value[^:$]*:?\s*\$?([0-9,]+)/i) ||
                      html.match(/Value[^:$]*:?\s*\$([0-9,]+)/i);
    const assessedValue = valueMatch ? `$${valueMatch[1]}` : 'Not Available';

    // If we found at least a parcel number or owner name, consider it a match
    if (parcelNumber || ownerName) {
      return {
        parcelNumber: parcelNumber || 'Not Found',
        ownerName: ownerName || 'Not Found',
        mailingAddress: mailingAddress || 'Not Available',
        propertyAddress: propertyAddress || searchAddress,
        assessedValue,
        lastUpdated: new Date().toISOString().split('T')[0]
      };
    }

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
    const { address } = await req.json();

    if (!address) {
      return new Response(
        JSON.stringify({ error: 'Address is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Processing lookup request for address: ${address}`);

    const assessorRecord = await searchPimaAssessor(address);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: assessorRecord,
        searchAddress: address 
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
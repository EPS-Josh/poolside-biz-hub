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
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssessorRecord {
  parcel_number: string;
  owner_name?: string;
  property_address?: string;
  mailing_address?: string;
  assessed_value?: number;
  property_type?: string;
  legal_description?: string;
  square_footage?: number;
  year_built?: number;
  lot_size?: number;
  zoning?: string;
  last_sale_date?: string;
  last_sale_price?: number;
}

// Generate realistic sample data for demo
function generateSampleData(batchNumber: number, batchSize: number): AssessorRecord[] {
  const streets = ['E MAIN ST', 'N ORACLE RD', 'W SPEEDWAY BLVD', 'S PARK AVE', 'E BROADWAY BLVD', 'N CAMPBELL AVE', 'W GRANT RD', 'E TANQUE VERDE RD'];
  const owners = ['SMITH JOHN', 'DOE JANE', 'WILSON FAMILY TRUST', 'GARCIA MARIA', 'JOHNSON ROBERT', 'BROWN SARAH', 'DAVIS MICHAEL', 'ANDERSON LISA'];
  const zoning = ['R-1', 'R-2', 'C-1', 'C-2', 'I-1'];
  const propertyTypes = ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL'];

  const records: AssessorRecord[] = [];
  const startNum = batchNumber * batchSize;

  for (let i = 0; i < batchSize; i++) {
    const houseNum = (startNum + i + 100);
    const streetIndex = (startNum + i) % streets.length;
    const ownerIndex = (startNum + i) % owners.length;
    
    records.push({
      parcel_number: `${Math.floor((startNum + i) / 1000) + 123}-${Math.floor(((startNum + i) % 1000) / 10) + 45}-${(startNum + i) % 100 + 678}`,
      owner_name: owners[ownerIndex],
      property_address: `${houseNum} ${streets[streetIndex]}`,
      mailing_address: `${houseNum} ${streets[streetIndex]}, TUCSON, AZ 857${String(streetIndex).padStart(2, '0')}`,
      assessed_value: Math.floor(Math.random() * 400000) + 150000,
      property_type: propertyTypes[i % propertyTypes.length],
      legal_description: `LOT ${(i % 20) + 1} BLK ${Math.floor(i / 20) + 1} SUBDIVISION ${batchNumber + 1}`,
      square_footage: Math.floor(Math.random() * 2000) + 1000,
      year_built: Math.floor(Math.random() * 50) + 1970,
      lot_size: Math.round((Math.random() * 0.5 + 0.15) * 100) / 100,
      zoning: zoning[i % zoning.length],
      last_sale_date: `20${Math.floor(Math.random() * 20) + 5}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      last_sale_price: Math.floor(Math.random() * 350000) + 120000,
    });
  }

  return records;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get batch info from request body
    const { batchNumber = 0, batchSize = 100 } = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    console.log(`Starting batch ${batchNumber} import with batch size ${batchSize}...`);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Only clear data on first batch
    if (batchNumber === 0) {
      console.log('Clearing existing assessor records...');
      await supabaseClient
        .from('pima_assessor_records')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
    }

    // Simulate total records (for demo purposes, we'll simulate 5000 total records)
    const totalRecords = 5000;
    const maxBatches = Math.ceil(totalRecords / batchSize);
    const hasMoreBatches = batchNumber < maxBatches - 1;

    if (batchNumber >= maxBatches) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'All batches completed',
          batchNumber,
          processed: 0,
          inserted: 0,
          totalRecords,
          hasMoreBatches: false,
          progress: 100
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Generate sample data for this batch
    console.log(`Generating sample data for batch ${batchNumber}...`);
    const records = generateSampleData(batchNumber, batchSize);

    // Insert records
    let inserted = 0;
    if (records.length > 0) {
      const { error } = await supabaseClient
        .from('pima_assessor_records')
        .insert(records);

      if (error) {
        console.error('Error inserting batch:', error);
        throw error;
      }
      
      inserted = records.length;
    }

    const progress = Math.round(((batchNumber + 1) * batchSize / totalRecords) * 100);
    
    console.log(`Batch ${batchNumber} completed: inserted ${inserted} records. Progress: ${progress}%`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Batch ${batchNumber} completed`,
        batchNumber,
        processed: records.length,
        inserted,
        totalRecords,
        hasMoreBatches,
        progress: Math.min(progress, 100),
        nextBatch: hasMoreBatches ? batchNumber + 1 : null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error importing assessor data:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
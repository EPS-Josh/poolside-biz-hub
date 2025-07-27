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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get batch info from request body
    const { batchNumber = 0, batchSize = 1000 } = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
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

    // Download and process the ZIP file
    console.log('Downloading ZIP file from Pima County...');
    const zipResponse = await fetch('https://www.asr.pima.gov/Downloads/Data/reference//Ownership.ZIP');
    
    if (!zipResponse.ok) {
      throw new Error(`Failed to download ZIP file: ${zipResponse.status}`);
    }

    const zipArrayBuffer = await zipResponse.arrayBuffer();
    console.log(`Downloaded ZIP file: ${zipArrayBuffer.byteLength} bytes`);

    // Extract and process the CSV
    const JSZip = (await import('https://esm.sh/jszip@3.10.1')).default;
    const zip = new JSZip();
    const zipContents = await zip.loadAsync(zipArrayBuffer);

    const csvFiles = Object.keys(zipContents.files).filter(filename => 
      filename.toLowerCase().endsWith('.csv') || filename.toLowerCase().endsWith('.txt')
    );

    if (csvFiles.length === 0) {
      throw new Error('No CSV files found in ZIP archive');
    }

    const csvFileName = csvFiles[0];
    const csvFile = zipContents.files[csvFileName];
    const csvContent = await csvFile.async('text');
    
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    console.log('CSV Headers:', headers);
    console.log(`Total lines in CSV: ${lines.length}`);

    // Calculate batch range
    const startIndex = (batchNumber * batchSize) + 1; // +1 to skip header
    const endIndex = Math.min(startIndex + batchSize, lines.length);
    const totalRecords = lines.length - 1; // Exclude header
    const hasMoreBatches = endIndex < lines.length;

    console.log(`Processing batch ${batchNumber}: lines ${startIndex} to ${endIndex - 1}`);

    if (startIndex >= lines.length) {
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

    // Process this batch
    const batchLines = lines.slice(startIndex, endIndex);
    const records: AssessorRecord[] = [];

    for (const line of batchLines) {
      if (!line.trim()) continue;

      // Parse CSV with proper quote handling
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      // Map to database schema (adjust indices based on actual CSV structure)
      const record: AssessorRecord = {
        parcel_number: values[0] || '',
        owner_name: values[1] || null,
        property_address: values[2] || null,
        mailing_address: values[3] || null,
        assessed_value: values[4] && !isNaN(parseFloat(values[4])) ? parseFloat(values[4]) : null,
        property_type: values[5] || null,
        legal_description: values[6] || null,
        square_footage: values[7] && !isNaN(parseInt(values[7])) ? parseInt(values[7]) : null,
        year_built: values[8] && !isNaN(parseInt(values[8])) ? parseInt(values[8]) : null,
        lot_size: values[9] && !isNaN(parseFloat(values[9])) ? parseFloat(values[9]) : null,
        zoning: values[10] || null,
        last_sale_date: values[11] || null,
        last_sale_price: values[12] && !isNaN(parseFloat(values[12])) ? parseFloat(values[12]) : null,
      };

      if (record.parcel_number) {
        records.push(record);
      }
    }

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
        processed: batchLines.length,
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
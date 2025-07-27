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
    const { batchNumber = 0, batchSize = 1000, action = 'download' } = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    console.log(`Processing batch ${batchNumber} with action: ${action}`);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Step 1: Download and store ZIP file if this is batch 0
    if (batchNumber === 0 && action === 'download') {
      console.log('Downloading ZIP file and storing in Supabase Storage...');
      
      // Clear existing data
      await supabaseClient
        .from('pima_assessor_records')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      // Download ZIP file
      const zipResponse = await fetch('https://www.asr.pima.gov/Downloads/Data/reference//Ownership.ZIP');
      if (!zipResponse.ok) {
        throw new Error(`Failed to download ZIP file: ${zipResponse.status}`);
      }

      const zipArrayBuffer = await zipResponse.arrayBuffer();
      console.log(`Downloaded ZIP file: ${zipArrayBuffer.byteLength} bytes`);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabaseClient.storage
        .from('data-imports')
        .upload('pima-ownership.zip', zipArrayBuffer, {
          contentType: 'application/zip',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('ZIP file uploaded to storage successfully');

      return new Response(
        JSON.stringify({
          success: true,
          message: 'ZIP file downloaded and stored. Ready to process batches.',
          action: 'file_stored',
          nextAction: 'process_batch'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Step 2: Process batches from stored ZIP file
    console.log(`Processing batch ${batchNumber} from stored ZIP file...`);

    // Download ZIP from storage
    const { data: zipFile, error: downloadError } = await supabaseClient.storage
      .from('data-imports')
      .download('pima-ownership.zip');

    if (downloadError) {
      console.error('Download from storage error:', downloadError);
      throw downloadError;
    }

    // Extract and parse CSV
    const JSZip = (await import('https://esm.sh/jszip@3.10.1')).default;
    const zip = new JSZip();
    const zipArrayBuffer = await zipFile.arrayBuffer();
    const zipContents = await zip.loadAsync(zipArrayBuffer);

    // Find CSV file
    const csvFiles = Object.keys(zipContents.files).filter(filename => 
      filename.toLowerCase().endsWith('.csv') || filename.toLowerCase().endsWith('.txt')
    );

    if (csvFiles.length === 0) {
      throw new Error('No CSV files found in ZIP archive');
    }

    const csvFileName = csvFiles[0];
    const csvFile = zipContents.files[csvFileName];
    
    // Get only the portion we need for this batch
    console.log('Extracting CSV content...');
    const csvContent = await csvFile.async('text');
    const lines = csvContent.split('\n');
    
    const totalRecords = lines.length - 1; // Exclude header
    const startIndex = (batchNumber * batchSize) + 1; // +1 to skip header
    const endIndex = Math.min(startIndex + batchSize, lines.length);
    const hasMoreBatches = endIndex < lines.length;

    console.log(`Processing lines ${startIndex} to ${endIndex - 1} of ${totalRecords} total records`);

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
      
      // Map to database schema - adjust indices based on actual CSV structure
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

    // Insert records in smaller sub-batches
    let inserted = 0;
    const subBatchSize = 100; // Insert 100 at a time to avoid large insert issues
    
    for (let i = 0; i < records.length; i += subBatchSize) {
      const subBatch = records.slice(i, i + subBatchSize);
      
      const { error } = await supabaseClient
        .from('pima_assessor_records')
        .insert(subBatch);

      if (error) {
        console.error('Error inserting sub-batch:', error);
        throw error;
      }
      
      inserted += subBatch.length;
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
    console.error('Error processing assessor data:', error);
    
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
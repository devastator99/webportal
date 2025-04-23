
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BUCKET_NAME = 'patient_medical_reports';

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization token from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header provided' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false }
      }
    );

    // Get request body
    const requestBody = await req.json();
    const { filePath, fileType } = requestBody;
    
    if (!filePath) {
      return new Response(
        JSON.stringify({ error: 'Missing file path parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Generating signed URL for path: ${filePath}, type: ${fileType || 'unknown'}`);

    // Determine if this is a PDF file
    const isPdf = filePath.toLowerCase().endsWith('.pdf') || fileType === 'pdf';
    
    // Generate a signed URL for the file with a longer expiration (24 hours)
    const { data: signedURL, error } = await supabaseClient
      .storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 60 * 60 * 24); // 24 hour expiration

    if (error) {
      console.error('Error generating signed URL:', error);
      return new Response(
        JSON.stringify({ error: 'Could not generate signed URL', details: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Extract filename from the path
    const filename = filePath.split('/').pop() || 'download';

    // Set appropriate headers based on file type
    const contentType = isPdf ? 'application/pdf' : 'application/octet-stream';
    const contentDisposition = `attachment; filename="${filename}"`;

    // Return the signed URL with appropriate headers for downloading
    return new Response(
      JSON.stringify({ 
        signedUrl: signedURL.signedUrl,
        filename: filename,
        contentType: contentType,
        contentDisposition: contentDisposition,
        expiresAt: new Date(Date.now() + (60 * 60 * 24 * 1000)).toISOString() // 24 hours from now
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});


import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import OpenAI from 'https://esm.sh/openai@4.24.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, documentUrl } = await req.json();

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    });

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the document content from storage
    const { data: document, error: downloadError } = await supabaseClient
      .storage
      .from('medical_files')
      .download(documentUrl);

    if (downloadError || !document) {
      throw new Error('Document not found');
    }

    // Convert the document to base64
    const bytes = await document.arrayBuffer();
    const base64String = `data:${document.type};base64,${btoa(
      String.fromCharCode(...new Uint8Array(bytes))
    )}`;

    // Analyze the document with OpenAI Vision
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Updated to use the correct model name
      messages: [
        {
          role: "system",
          content: "You are a medical document analyzer. Provide a concise summary of the medical document, highlighting key findings, abnormal values, and recommendations if any."
        },
        {
          role: "user",
          content: [
            {
              type: "image",
              image_url: base64String
            },
            {
              type: "text",
              text: "Please analyze this medical document and provide a summary."
            }
          ]
        }
      ],
      max_tokens: 500
    });

    // Store the summary in the database
    const { error: insertError } = await supabaseClient
      .from('document_summaries')
      .upsert({
        document_id: documentId,
        summary: response.choices[0].message.content
      });

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ 
        summary: response.choices[0].message.content 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

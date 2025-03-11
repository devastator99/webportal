
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BhashiniAuthResponse {
  token: string;
}

interface TranslationRequest {
  sourceLanguage: string;
  targetLanguage: string;
  text: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { sourceLanguage, targetLanguage, text } = await req.json() as TranslationRequest;
    
    console.log(`Translating from ${sourceLanguage} to ${targetLanguage}: "${text}"`);
    
    // Step 1: Get Bhashini authorization token
    const authResponse = await fetch('https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelKey', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'userID': Deno.env.get('BHASHINI_USER_ID') || '',
        'ulcaApiKey': Deno.env.get('BHASHINI_API_KEY') || '',
      },
      body: JSON.stringify({
        modelId: Deno.env.get('BHASHINI_MODEL_ID') || '',
      }),
    });
    
    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('Bhashini auth error:', errorText);
      throw new Error(`Bhashini auth error: ${authResponse.status} ${errorText}`);
    }
    
    const authData = await authResponse.json() as BhashiniAuthResponse;
    
    // Step 2: Use token to perform translation
    const translationResponse = await fetch('https://api.bhashini.gov.in/translate/v1/model/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authData.token,
      },
      body: JSON.stringify({
        source: {
          sourceLanguage,
          sourceText: [text],
        },
        target: {
          targetLanguage,
        },
      }),
    });
    
    if (!translationResponse.ok) {
      const errorText = await translationResponse.text();
      console.error('Translation error:', errorText);
      throw new Error(`Translation error: ${translationResponse.status} ${errorText}`);
    }
    
    const translationData = await translationResponse.json();
    
    return new Response(
      JSON.stringify({
        translation: translationData.translation || translationData,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Error in Bhashini API function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

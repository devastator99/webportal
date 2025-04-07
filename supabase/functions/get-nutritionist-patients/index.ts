
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request body
    const { nutritionist_id } = await req.json();

    if (!nutritionist_id) {
      return new Response(
        JSON.stringify({ error: "Nutritionist ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a Supabase client with the auth context
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: req.headers.get("Authorization")! } },
      }
    );
    
    // Call the secure RPC function for getting nutritionist's patients
    console.log("Calling get_nutritionist_patients RPC with nutritionist ID:", nutritionist_id);
    const { data, error } = await supabaseClient.rpc('get_nutritionist_patients', {
      p_nutritionist_id: nutritionist_id
    });
    
    if (error) {
      console.error('Error fetching nutritionist patients:', error);
      throw error;
    }
    
    // Format the response to match expected interface
    const formattedPatients = (data || []).map((patient: any) => ({
      id: patient.patient_id,
      first_name: patient.patient_first_name,
      last_name: patient.patient_last_name
    }));
    
    console.log(`Retrieved ${formattedPatients.length} patients for nutritionist ${nutritionist_id}`);

    // Return the data
    return new Response(
      JSON.stringify(formattedPatients || []),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

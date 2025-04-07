
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
    const { doctor_id } = await req.json();

    if (!doctor_id) {
      return new Response(
        JSON.stringify({ error: "Doctor ID is required" }),
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
    
    // Call the secure RPC function for getting doctor's patients
    console.log("Calling get_doctor_patients RPC with doctor ID:", doctor_id);
    const { data, error } = await supabaseClient.rpc('get_doctor_patients', {
      p_doctor_id: doctor_id
    });
    
    if (error) {
      console.error('Error fetching doctor patients:', error);
      throw error;
    }
    
    console.log(`Retrieved ${data?.length || 0} patients for doctor ${doctor_id}`);

    // Return the data
    return new Response(
      JSON.stringify(data || []),
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

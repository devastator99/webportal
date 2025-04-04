
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patient_id, nutritionist_id, admin_id } = await req.json();
    
    if (!patient_id || !nutritionist_id) {
      return new Response(
        JSON.stringify({ error: "Patient ID and nutritionist ID are required" }),
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

    // First, remove any existing nutritionist assignment for this patient
    await supabaseClient
      .from("patient_nutritionist_assignments")
      .delete()
      .eq("patient_id", patient_id);
    
    // Then, create the new assignment
    const { data, error } = await supabaseClient
      .from("patient_nutritionist_assignments")
      .insert({ patient_id, nutritionist_id })
      .select()
      .single();
    
    if (error) {
      console.error("Error in creating patient-nutritionist assignment:", error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data,
        message: "Nutritionist assigned to patient successfully" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in admin-assign-nutritionist-to-patient:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

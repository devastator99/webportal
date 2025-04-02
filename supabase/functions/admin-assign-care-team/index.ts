
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: req.headers.get("Authorization")! } },
      }
    );

    const { action, patientId, doctorId, nutritionistId } = await req.json();

    // Log the request for debugging
    console.log(`Admin Care Team Assignment: ${action}`, { patientId, doctorId, nutritionistId });
    
    if (!patientId) {
      return new Response(
        JSON.stringify({ error: "Patient ID is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    let result;
    
    if (action === "assignDoctor" && doctorId) {
      // Assign doctor to patient
      const { data, error } = await supabaseClient
        .from('patient_doctor_assignments')
        .upsert({ 
          patient_id: patientId, 
          doctor_id: doctorId 
        })
        .select();
        
      if (error) throw error;
      result = { success: true, data };
    } 
    else if (action === "assignNutritionist" && nutritionistId) {
      // Assign nutritionist to patient
      const { data, error } = await supabaseClient
        .from('patient_nutritionist_assignments')
        .upsert({ 
          patient_id: patientId, 
          nutritionist_id: nutritionistId 
        })
        .select();
        
      if (error) throw error;
      result = { success: true, data };
    } 
    else {
      return new Response(
        JSON.stringify({ error: "Invalid action or missing required parameters" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in admin-assign-care-team function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "An unknown error occurred" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

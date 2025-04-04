
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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", // Use service role key to bypass RLS
      // Remove the Authorization header to prevent JWT token usage which causes recursion
      { auth: { persistSession: false } }
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
      // Use RPC call to assign doctor to patient
      console.log("Assigning doctor to patient via RPC:", { patientId, doctorId });
      
      const { data, error } = await supabaseClient.rpc(
        'assign_doctor_to_patient',
        {
          p_patient_id: patientId,
          p_doctor_id: doctorId
        }
      );
      
      if (error) {
        console.error("Error in doctor assignment RPC:", error);
        throw error;
      }
      
      console.log("Doctor assignment RPC response:", data);
      
      result = { success: true, data };
    } 
    else if (action === "assignNutritionist" && nutritionistId) {
      // Assign nutritionist to patient
      console.log("Assigning nutritionist to patient:", { patientId, nutritionistId });
      
      if (!doctorId) {
        return new Response(
          JSON.stringify({ error: "Doctor ID is required when assigning a nutritionist" }),
          { 
            status: 400, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      // Use RPC call to assign nutritionist
      const { data, error } = await supabaseClient.rpc(
        'assign_patient_to_nutritionist',
        {
          p_patient_id: patientId,
          p_nutritionist_id: nutritionistId,
          p_doctor_id: doctorId
        }
      );
      
      if (error) {
        console.error("Error in nutritionist assignment RPC:", error);
        throw error;
      }
      
      console.log("Nutritionist assignment RPC response:", data);
      
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

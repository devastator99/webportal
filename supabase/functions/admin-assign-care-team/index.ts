
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
      console.log("Assigning doctor to patient:", { patientId, doctorId });
      
      // First check if the assignment already exists
      const { data: existingAssignment, error: existingError } = await supabaseClient
        .from('patient_doctor_assignments')
        .select()
        .eq('patient_id', patientId)
        .eq('doctor_id', doctorId)
        .maybeSingle();
      
      if (existingError) {
        console.error("Error checking existing doctor assignment:", existingError);
      }
      
      let assignmentData;
      if (existingAssignment) {
        console.log("Doctor assignment already exists:", existingAssignment);
        assignmentData = existingAssignment;
      } else {
        // Insert new assignment
        const { data, error } = await supabaseClient
          .from('patient_doctor_assignments')
          .insert({ 
            patient_id: patientId, 
            doctor_id: doctorId 
          })
          .select()
          .single();
          
        if (error) {
          console.error("Error assigning doctor:", error);
          throw error;
        }
        
        console.log("New doctor assignment created:", data);
        assignmentData = data;
      }
      
      result = { success: true, data: assignmentData };
    } 
    else if (action === "assignNutritionist" && nutritionistId) {
      // Assign nutritionist to patient
      console.log("Assigning nutritionist to patient:", { patientId, nutritionistId });
      
      // First check if the assignment already exists
      const { data: existingAssignment, error: existingError } = await supabaseClient
        .from('patient_nutritionist_assignments')
        .select()
        .eq('patient_id', patientId)
        .eq('nutritionist_id', nutritionistId)
        .maybeSingle();
      
      if (existingError) {
        console.error("Error checking existing nutritionist assignment:", existingError);
      }
      
      let assignmentData;
      if (existingAssignment) {
        console.log("Nutritionist assignment already exists:", existingAssignment);
        assignmentData = existingAssignment;
      } else {
        // Insert new assignment
        const { data, error } = await supabaseClient
          .from('patient_nutritionist_assignments')
          .insert({ 
            patient_id: patientId, 
            nutritionist_id: nutritionistId 
          })
          .select()
          .single();
          
        if (error) {
          console.error("Error assigning nutritionist:", error);
          throw error;
        }
        
        console.log("New nutritionist assignment created:", data);
        assignmentData = data;
      }
      
      result = { success: true, data: assignmentData };
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

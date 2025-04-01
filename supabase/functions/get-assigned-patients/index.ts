
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface PatientProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

serve(async (req: Request) => {
  try {
    const { provider_id, provider_role } = await req.json();
    
    if (!provider_id || !provider_role) {
      return new Response(
        JSON.stringify({ error: "Provider ID and role are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create a Supabase client with the auth context of the request
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: req.headers.get("Authorization")! } },
      }
    );
    
    let patients: PatientProfile[] = [];
    
    if (provider_role === 'doctor') {
      // Get patients assigned to this doctor
      const { data, error } = await supabaseClient
        .from('patient_doctor_assignments')
        .select('patient:patient_id(id, first_name, last_name)')
        .eq('doctor_id', provider_id);
        
      if (error) {
        console.error("Error fetching doctor's patients:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
      
      patients = data.map(item => item.patient).filter(Boolean);
    }
    else if (provider_role === 'nutritionist') {
      // Get patients assigned to this nutritionist
      const { data, error } = await supabaseClient
        .from('patient_nutritionist_assignments')
        .select('patient:patient_id(id, first_name, last_name)')
        .eq('nutritionist_id', provider_id);
        
      if (error) {
        console.error("Error fetching nutritionist's patients:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
      
      patients = data.map(item => item.patient).filter(Boolean);
    }
    
    return new Response(
      JSON.stringify(patients),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});


import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patient_id } = await req.json();

    if (!patient_id) {
      return new Response(
        JSON.stringify({ error: "Patient ID is required" }),
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

    const careTeam: UserProfile[] = [];

    // Get doctor from patient_doctor_assignments table
    const { data: doctorAssignments, error: doctorError } = await supabaseClient
      .from("patient_doctor_assignments")
      .select("doctor_id")
      .eq("patient_id", patient_id)
      .single();

    if (doctorError) {
      console.error("Error fetching doctor assignment:", doctorError);
    } 
    
    if (doctorAssignments?.doctor_id) {
      const { data: doctor, error: doctorProfileError } = await supabaseClient
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("id", doctorAssignments.doctor_id)
        .single();

      if (!doctorProfileError && doctor) {
        careTeam.push({
          ...doctor,
          role: "doctor"
        });
      }
    }

    // Get nutritionist from patient_nutritionist_assignments table
    const { data: nutritionistAssignments, error: nutritionistError } = await supabaseClient
      .from("patient_nutritionist_assignments")
      .select("nutritionist_id")
      .eq("patient_id", patient_id)
      .single();

    if (nutritionistError) {
      console.error("Error fetching nutritionist assignment:", nutritionistError);
    }
    
    if (nutritionistAssignments?.nutritionist_id) {
      const { data: nutritionist, error: nutritionistProfileError } = await supabaseClient
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("id", nutritionistAssignments.nutritionist_id)
        .single();

      if (!nutritionistProfileError && nutritionist) {
        careTeam.push({
          ...nutritionist,
          role: "nutritionist"
        });
      }
    }

    // Add AI bot to care team
    careTeam.push({
      id: '00000000-0000-0000-0000-000000000000',
      first_name: 'AI',
      last_name: 'Assistant',
      role: 'aibot'
    });

    return new Response(
      JSON.stringify(careTeam),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in get-patient-care-team:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

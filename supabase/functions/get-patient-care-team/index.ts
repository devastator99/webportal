
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

    // Get doctor from patient_assignments table
    const { data: assignment, error: assignmentError } = await supabaseClient
      .from("patient_assignments")
      .select("doctor_id, nutritionist_id")
      .eq("patient_id", patient_id)
      .single();

    if (assignmentError && assignmentError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      console.error("Error fetching assignment:", assignmentError);
    } 
    
    if (assignment?.doctor_id) {
      const { data: doctor, error: doctorProfileError } = await supabaseClient
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("id", assignment.doctor_id)
        .single();

      if (!doctorProfileError && doctor) {
        careTeam.push({
          ...doctor,
          role: "doctor"
        });
      }
    }

    // Get nutritionist from the same patient_assignments record
    if (assignment?.nutritionist_id) {
      const { data: nutritionist, error: nutritionistProfileError } = await supabaseClient
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("id", assignment.nutritionist_id)
        .single();

      if (!nutritionistProfileError && nutritionist) {
        careTeam.push({
          ...nutritionist,
          role: "nutritionist"
        });
      }
    }

    // Add AI bot to care team (now a real user)
    const { data: aiBot, error: aiBotError } = await supabaseClient
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("id", '00000000-0000-0000-0000-000000000000')
      .single();
    
    if (!aiBotError && aiBot) {
      careTeam.push({
        ...aiBot,
        role: "aibot"
      });
    }

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

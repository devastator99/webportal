
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

    // Use the RPC function to get care team members
    const { data: careTeamMembers, error: rpcError } = await supabaseClient.rpc(
      'get_patient_care_team_members',
      { p_patient_id: patient_id }
    );

    if (!rpcError && careTeamMembers && careTeamMembers.length > 0) {
      // RPC successful, return the results
      return new Response(
        JSON.stringify(careTeamMembers),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Fall back to the original implementation if RPC fails
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
        // Get doctor's role from user_roles table
        const { data: doctorRole } = await supabaseClient
          .from("user_roles")
          .select("role")
          .eq("user_id", doctor.id)
          .single();

        careTeam.push({
          ...doctor,
          role: doctorRole?.role || "doctor"
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
        // Get nutritionist's role from user_roles table
        const { data: nutritionistRole } = await supabaseClient
          .from("user_roles")
          .select("role")
          .eq("user_id", nutritionist.id)
          .single();

        careTeam.push({
          ...nutritionist,
          role: nutritionistRole?.role || "nutritionist"
        });
      }
    }

    // Add AI bot to care team (now a real user)
    const AI_BOT_ID = '00000000-0000-0000-0000-000000000000';
    const { data: aiBot, error: aiBotError } = await supabaseClient
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("id", AI_BOT_ID)
      .single();
    
    if (!aiBotError && aiBot) {
      // Get AI bot's role from user_roles table
      const { data: aiBotRole } = await supabaseClient
        .from("user_roles")
        .select("role")
        .eq("user_id", AI_BOT_ID)
        .single();

      careTeam.push({
        ...aiBot,
        role: "aibot" // Always use 'aibot' as role regardless of the actual role in the database
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

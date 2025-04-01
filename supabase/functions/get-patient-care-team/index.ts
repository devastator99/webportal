
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role?: string;
}

serve(async (req: Request) => {
  try {
    const { patient_id } = await req.json();
    
    if (!patient_id) {
      return new Response(
        JSON.stringify({ error: "Patient ID is required" }),
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
    
    // Get patient's doctor
    const { data: doctorData, error: doctorError } = await supabaseClient
      .from('patient_doctor_assignments')
      .select('doctor:doctor_id(id, first_name, last_name)')
      .eq('patient_id', patient_id)
      .maybeSingle();
      
    if (doctorError) {
      console.error("Error fetching doctor:", doctorError);
    }
    
    // Get patient's nutritionist
    const { data: nutritionistData, error: nutritionistError } = await supabaseClient
      .from('patient_nutritionist_assignments')
      .select('nutritionist:nutritionist_id(id, first_name, last_name)')
      .eq('patient_id', patient_id)
      .maybeSingle();
      
    if (nutritionistError) {
      console.error("Error fetching nutritionist:", nutritionistError);
    }
    
    // Build care team members
    const careTeamMembers: UserProfile[] = [];
    
    // Add doctor to care team if available
    if (doctorData && doctorData.doctor) {
      careTeamMembers.push({
        id: doctorData.doctor.id,
        first_name: doctorData.doctor.first_name,
        last_name: doctorData.doctor.last_name,
        role: 'doctor'
      });
    }
    
    // Add nutritionist to care team if available
    if (nutritionistData && nutritionistData.nutritionist) {
      careTeamMembers.push({
        id: nutritionistData.nutritionist.id,
        first_name: nutritionistData.nutritionist.first_name,
        last_name: nutritionistData.nutritionist.last_name,
        role: 'nutritionist'
      });
    }
    
    // Always add AI bot to care team
    careTeamMembers.push({
      id: '00000000-0000-0000-0000-000000000000',
      first_name: 'AI',
      last_name: 'Assistant',
      role: 'aibot'
    });
    
    return new Response(
      JSON.stringify(careTeamMembers),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

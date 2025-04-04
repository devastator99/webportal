
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    const { patient_id } = await req.json();
    
    if (!patient_id) {
      return new Response(
        JSON.stringify({ error: "Patient ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
    
    // First try to get doctor from patient_doctor_assignments
    const { data: doctorData, error: doctorError } = await supabaseClient
      .from("patient_doctor_assignments")
      .select("doctor_id")
      .eq("patient_id", patient_id)
      .single();
      
    // Then try to get nutritionist from patient_nutritionist_assignments
    const { data: nutritionistData, error: nutritionistError } = await supabaseClient
      .from("patient_nutritionist_assignments")
      .select("nutritionist_id")
      .eq("patient_id", patient_id)
      .single();
    
    // Array to collect care team members
    const careTeam: UserProfile[] = [];
    
    // If doctor found, get their profile
    if (doctorData && doctorData.doctor_id) {
      const { data: doctorProfile, error: doctorProfileError } = await supabaseClient
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("id", doctorData.doctor_id)
        .single();
        
      if (doctorProfile && !doctorProfileError) {
        careTeam.push({
          id: doctorProfile.id,
          first_name: doctorProfile.first_name,
          last_name: doctorProfile.last_name,
          role: "doctor"
        });
      }
    }
    
    // If nutritionist found, get their profile
    if (nutritionistData && nutritionistData.nutritionist_id) {
      const { data: nutritionistProfile, error: nutritionistProfileError } = await supabaseClient
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("id", nutritionistData.nutritionist_id)
        .single();
        
      if (nutritionistProfile && !nutritionistProfileError) {
        careTeam.push({
          id: nutritionistProfile.id,
          first_name: nutritionistProfile.first_name,
          last_name: nutritionistProfile.last_name,
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

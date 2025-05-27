
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse the request body
    const { 
      patientId, 
      age, 
      gender, 
      bloodGroup, 
      allergies, 
      emergencyContact,
      height,
      birthDate,
      foodHabit,
      currentMedicalConditions
    } = await req.json();
    
    // Updated validation - only patientId, age, gender, and bloodGroup are required
    // emergencyContact is now optional as per the new frontend requirements
    if (!patientId || !age || !gender || !bloodGroup) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: patientId, age, gender, and bloodGroup are required" }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
    
    // Create a metadata object for patient details
    const patientMetadata = {
      age,
      gender,
      blood_group: bloodGroup,
      allergies: allergies || null,
      emergency_contact: emergencyContact || null, // Explicitly allow null for optional field
      height: height || null,
      birth_date: birthDate || null,
      food_habit: foodHabit || null,
      current_medical_conditions: currentMedicalConditions || null
    };
    
    // Update the user's metadata
    const { data, error } = await supabase.auth.admin.updateUserById(
      patientId,
      {
        user_metadata: patientMetadata
      }
    );
    
    if (error) {
      return new Response(
        JSON.stringify({ error: "Error updating patient details", details: error.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
    
    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
    
  } catch (error) {
    console.error("Unhandled error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Server error", 
        details: error.message || "Unknown error occurred" 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

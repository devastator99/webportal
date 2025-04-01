
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface NutritionistProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
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
    
    // Get patient's nutritionist
    const { data: nutritionistData, error: nutritionistError } = await supabaseClient
      .from('patient_nutritionist_assignments')
      .select('nutritionist:nutritionist_id(id, first_name, last_name)')
      .eq('patient_id', patient_id)
      .maybeSingle();
      
    if (nutritionistError) {
      console.error("Error fetching nutritionist:", nutritionistError);
      return new Response(
        JSON.stringify({ error: nutritionistError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    const result = nutritionistData && nutritionistData.nutritionist ? [nutritionistData.nutritionist] : [];
    
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

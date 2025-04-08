
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Supabase connection parameters from environment
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase connection parameters");
    }
    
    // Create Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log("Running fix for care team rooms with missing doctors...");
    
    // Run the fix_care_team_rooms_missing_doctors function
    const { data: fixResults, error: fixError } = await supabase
      .rpc('fix_care_team_rooms_missing_doctors');
      
    if (fixError) {
      throw new Error(`Failed to run fix: ${fixError.message}`);
    }
    
    console.log("Fix results:", fixResults);
    
    // Count the fixes
    const totalFixes = fixResults ? fixResults.length : 0;
    const successfulFixes = fixResults ? fixResults.filter(r => !r.action.includes('Error')).length : 0;
    const errorFixes = totalFixes - successfulFixes;
    
    return new Response(
      JSON.stringify({
        success: true,
        totalFixes,
        successfulFixes,
        errorFixes,
        details: fixResults
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error("Error in fix-doctor-room-access edge function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

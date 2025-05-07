
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    // Create a Supabase client with admin rights using service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        global: { headers: { Authorization: req.headers.get("Authorization")! } },
      }
    );
    
    // Get the request body as JSON
    const requestData = await req.json();
    const { admin_id } = requestData;
    
    if (!admin_id) {
      return new Response(
        JSON.stringify({ error: "Administrator ID is required" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    // Check if the requesting user is an admin
    const { data: isAdminData, error: isAdminError } = await supabaseClient.rpc(
      'is_admin',
      { user_id: admin_id }
    );
    
    if (isAdminError || !isAdminData) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Only administrators can sync care team rooms" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403 
        }
      );
    }
    
    // Call the PostgreSQL function to ensure all care team memberships
    const { data: syncData, error: syncError } = await supabaseClient.rpc(
      'ensure_care_team_memberships'
    );
    
    if (syncError) {
      console.error("Error syncing care team rooms:", syncError);
      return new Response(
        JSON.stringify({ error: "Failed to sync care team rooms: " + syncError.message }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Care team rooms have been synchronized successfully"
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error: " + error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});

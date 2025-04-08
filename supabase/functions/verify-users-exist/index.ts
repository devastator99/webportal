
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables for Supabase connection");
    }

    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user IDs to verify from request body
    const { userIds } = await req.json();
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid request. Expected an array of userIds." 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`Verifying existence of ${userIds.length} users`);
    
    // Query auth.users to check which IDs exist
    const { data, error } = await supabase.auth.admin.listUsers({
      perPage: 1000, // Set a reasonable limit
    });
    
    if (error) {
      throw new Error(`Error querying users: ${error.message}`);
    }

    // Extract the IDs of all users
    const existingUserIds = new Set(data.users.map(user => user.id));
    
    // Determine which IDs are valid and which are invalid
    const validUserIds = userIds.filter(id => existingUserIds.has(id));
    const invalidUserIds = userIds.filter(id => !existingUserIds.has(id));
    
    console.log(`Found ${validUserIds.length} valid users and ${invalidUserIds.length} invalid users`);

    return new Response(
      JSON.stringify({ 
        validUserIds, 
        invalidUserIds 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in verify-users-exist:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

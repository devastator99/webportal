
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

    // Query auth.users to check which IDs exist
    const { data, error } = await supabase.auth.admin.listUsers({
      perPage: 1000, // Set a reasonable limit
    });
    
    if (error) {
      throw new Error(`Error querying users: ${error.message}`);
    }

    // Extract the IDs of all users
    const existingUserIds = new Set(data.users.map(user => user.id));
    
    // Check if profiles exist for users
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .in('id', userIds);
      
    if (profilesError) {
      throw new Error(`Error checking profiles: ${profilesError.message}`);
    }
    
    const existingProfileIds = new Set(profilesData.map(profile => profile.id));
    
    // Determine which IDs are valid (exist in both auth.users AND profiles) and which are invalid
    const validUserIds = userIds.filter(id => 
      existingUserIds.has(id) && existingProfileIds.has(id)
    );
    
    const invalidUserIds = userIds.filter(id => 
      !existingUserIds.has(id) || !existingProfileIds.has(id)
    );
    
    // Also identify users that exist in auth.users but don't have profiles yet
    const missingProfiles = userIds.filter(id => 
      existingUserIds.has(id) && !existingProfileIds.has(id)
    );
    
    console.log(`Found ${validUserIds.length} valid users and ${invalidUserIds.length} invalid users`);
    console.log(`Found ${missingProfiles.length} users missing profiles`);

    return new Response(
      JSON.stringify({ 
        validUserIds, 
        invalidUserIds,
        missingProfiles
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

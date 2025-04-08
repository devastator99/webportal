
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
      console.error("Missing environment variables for Supabase connection");
      throw new Error("Missing environment variables for Supabase connection");
    }

    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user IDs to verify from request body
    const requestData = await req.json();
    console.log("Request data:", JSON.stringify(requestData));
    
    const userIds = requestData.userIds;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      console.error("Invalid request data:", JSON.stringify(requestData));
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

    console.log(`Verifying ${userIds.length} user IDs:`, userIds);

    // Get profiles directly (avoid auth.users query which can cause issues)
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .in('id', userIds);
      
    if (profilesError) {
      console.error("Error querying profiles:", profilesError);
      throw new Error(`Error checking profiles: ${profilesError.message}`);
    }
    
    // Extract the IDs of users with profiles
    const existingProfileIds = new Set(profilesData?.map(profile => profile.id) || []);
    console.log("Found profiles:", Array.from(existingProfileIds));
    
    // Now explicitly check which users exist in auth.users
    const { data: authUsers, error: authUsersError } = await supabase
      .from('auth_users_view')  // Using a view that's allowed by service role
      .select('id')
      .in('id', userIds);
    
    if (authUsersError) {
      console.error("Error querying auth users:", authUsersError);
      // Try alternate approach if this view doesn't exist
      const validUserIds = userIds.filter(id => existingProfileIds.has(id));
      const invalidUserIds = userIds.filter(id => !existingProfileIds.has(id));
      const missingProfiles: string[] = []; // Can't determine these without access to auth.users
      
      console.log(`Using profiles-only approach. Found ${validUserIds.length} valid users and ${invalidUserIds.length} invalid users`);
      
      return new Response(
        JSON.stringify({ 
          validUserIds, 
          invalidUserIds,
          missingProfiles,
          note: "Limited verification: only checked profiles table"
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Extract the IDs of all auth users
    const existingAuthUserIds = new Set(authUsers?.map(user => user.id) || []);
    console.log("Found auth users:", Array.from(existingAuthUserIds));
    
    // Determine which IDs are valid (exist in both auth.users AND profiles) and which are invalid
    const validUserIds = userIds.filter(id => 
      existingAuthUserIds.has(id) && existingProfileIds.has(id)
    );
    
    const invalidUserIds = userIds.filter(id => 
      !existingAuthUserIds.has(id) || (!existingProfileIds.has(id) && !existingAuthUserIds.has(id))
    );
    
    // Also identify users that exist in auth.users but don't have profiles yet
    const missingProfiles = userIds.filter(id => 
      existingAuthUserIds.has(id) && !existingProfileIds.has(id)
    );
    
    console.log(`Found ${validUserIds.length} valid users and ${invalidUserIds.length} invalid users`);
    console.log(`Found ${missingProfiles.length} users missing profiles`);
    console.log("Valid user IDs:", validUserIds);
    console.log("Invalid user IDs:", invalidUserIds);
    console.log("Missing profiles:", missingProfiles);

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

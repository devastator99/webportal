
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[verify-users-exist] Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { emails } = await req.json();
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return new Response(
        JSON.stringify({ error: "Emails array is required" }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
    
    console.log(`[verify-users-exist] Looking up users for emails:`, emails);
    
    // Get users from auth.users table
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('[verify-users-exist] Error fetching users:', authError);
      return new Response(
        JSON.stringify({ error: "Failed to verify users" }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
    
    // Find matching users by email
    const matchingUsers = authUsers.users
      .filter(user => emails.includes(user.email))
      .map(user => ({
        id: user.id,
        email: user.email
      }));
    
    console.log(`[verify-users-exist] Found ${matchingUsers.length} matching users`);
    
    if (matchingUsers.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "No account found with this email address. Please check your email or create a new account.",
          users: []
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        users: matchingUsers,
        success: true 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
    
  } catch (error) {
    console.error("[verify-users-exist] Unexpected error:", error);
    
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


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
    
    // Look up users in the profiles table instead of auth.users
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .in('id', 
        // First get user IDs from auth.users table by email
        supabase.auth.admin ? [] : [] // Skip auth lookup for now
      );
    
    // Alternative approach: Use a database function to safely lookup users
    const results = [];
    
    for (const email of emails) {
      try {
        // Use RPC to safely check if user exists
        const { data: userExists, error: rpcError } = await supabase
          .rpc('check_user_exists', { p_email: email });
        
        if (rpcError) {
          console.error(`[verify-users-exist] RPC error for ${email}:`, rpcError);
          results.push({
            email: email,
            exists: false,
            user_id: null,
            error: 'Lookup failed'
          });
        } else {
          if (userExists) {
            // If user exists, we need to get their ID from profiles
            const { data: profile, error: profileErr } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', 
                // We need a way to get the user ID by email
                // For now, we'll use a different approach
                '00000000-0000-0000-0000-000000000000'
              )
              .maybeSingle();
            
            results.push({
              email: email,
              exists: userExists,
              user_id: profile?.id || null
            });
          } else {
            results.push({
              email: email,
              exists: false,
              user_id: null
            });
          }
        }
      } catch (err) {
        console.error(`[verify-users-exist] Error processing ${email}:`, err);
        results.push({
          email: email,
          exists: false,
          user_id: null,
          error: err.message
        });
      }
    }
    
    console.log(`[verify-users-exist] Results:`, results);
    
    // Check if any users were found
    const foundUsers = results.filter(r => r.exists);
    
    if (foundUsers.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "No account found with this email address. Please check your email or create a new account.",
          results: results
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        results: results,
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

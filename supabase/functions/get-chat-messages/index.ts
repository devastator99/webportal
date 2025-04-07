
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, other_user_id, page = 1, per_page = 50 } = await req.json();
    
    if (!user_id || !other_user_id) {
      return new Response(
        JSON.stringify({ error: "User ID and other user ID are required" }),
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
    
    // Calculate pagination
    const pageNumber = parseInt(String(page));
    const perPage = parseInt(String(per_page));
    const offset = (pageNumber - 1) * perPage;
    
    // Use the get_care_team_messages RPC function
    console.log("Using get_care_team_messages RPC function");
    const result = await supabaseClient.rpc('get_care_team_messages', {
      p_user_id: user_id,
      p_patient_id: other_user_id,
      p_offset: offset,
      p_limit: perPage
    });
    
    if (result.error) {
      console.error("Error fetching chat messages:", result.error);
      return new Response(
        JSON.stringify({ error: result.error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get count for pagination
    const countResult = await supabaseClient.rpc('get_care_team_messages_count', {
      p_user_id: user_id,
      p_patient_id: other_user_id
    });
    
    if (countResult.error) {
      console.error("Error getting message count:", countResult.error);
      return new Response(
        JSON.stringify({ error: countResult.error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const count = countResult.data;
    const data = result.data;
    
    // Determine if there are more messages
    const hasMore = count != null && count > offset + (data?.length || 0);
    
    return new Response(
      JSON.stringify({
        messages: data || [],
        hasMore,
        totalCount: count,
        page: pageNumber,
        perPage
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Exception in get-chat-messages:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

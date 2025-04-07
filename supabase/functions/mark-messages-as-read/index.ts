
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
    const { user_id, sender_id } = await req.json();
    
    if (!user_id || !sender_id) {
      return new Response(
        JSON.stringify({ error: "User ID and sender ID are required" }),
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
    
    console.log(`Marking messages as read: receiver=${user_id}, sender=${sender_id}`);
    
    // Try using the RPC function first
    try {
      const { data, error } = await supabaseClient.rpc('mark_messages_as_read', {
        p_user_id: user_id,
        p_sender_id: sender_id
      });
      
      if (error) {
        console.error("Error calling mark_messages_as_read RPC:", error);
        throw error;
      }
      
      console.log("Successfully marked messages as read via RPC");
      
      return new Response(
        JSON.stringify({ success: true, result: data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (rpcError) {
      console.warn("RPC function failed, falling back to direct update:", rpcError);
      
      // Fallback: Update the messages directly
      const { data, error } = await supabaseClient
        .from('chat_messages')
        .update({ read: true })
        .eq('receiver_id', user_id)
        .eq('sender_id', sender_id)
        .eq('read', false)
        .select();
      
      if (error) {
        console.error("Error with direct update fallback:", error);
        throw error;
      }
      
      console.log(`Successfully marked ${data?.length || 0} messages as read via direct update`);
      
      return new Response(
        JSON.stringify({ success: true, result: data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
  } catch (error) {
    console.error("Exception in mark-messages-as-read:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});


import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  try {
    const { sender_id, receiver_id, message, message_type = 'text' } = await req.json();
    
    if (!sender_id || !receiver_id || !message) {
      return new Response(
        JSON.stringify({ error: "Sender ID, receiver ID, and message are required" }),
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
    
    // Insert the new message
    const { data, error } = await supabaseClient
      .from('chat_messages')
      .insert({
        sender_id,
        receiver_id,
        message,
        message_type
      })
      .select('id')
      .single();
      
    if (error) {
      console.error("Error sending chat message:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ id: data.id }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

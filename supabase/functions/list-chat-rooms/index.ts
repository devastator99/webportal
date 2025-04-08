
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
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
    
    // Get all chat rooms with their members count and last message
    const { data: rooms, error } = await supabase
      .from('chat_rooms')
      .select(`
        id,
        name,
        description,
        room_type,
        created_at,
        patient_id,
        profiles:patient_id(first_name, last_name),
        members_count:room_members(count),
        room_members(
          user_id,
          role,
          profiles:user_id(first_name, last_name)
        )
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Error fetching chat rooms:", error);
      throw error;
    }
    
    // Get the last message for each room
    for (const room of rooms || []) {
      const { data: lastMessage, error: msgError } = await supabase
        .from('room_messages')
        .select('message, created_at, sender_id, profiles:sender_id(first_name, last_name)')
        .eq('room_id', room.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (!msgError && lastMessage) {
        room.last_message = lastMessage;
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        rooms: rooms || [],
        count: rooms?.length || 0
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in list-chat-rooms:", error);
    
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

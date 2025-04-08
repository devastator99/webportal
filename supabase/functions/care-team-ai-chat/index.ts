
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { roomId, message } = await req.json();
    
    if (!roomId || !message) {
      return new Response(
        JSON.stringify({ error: "Room ID and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
    );
    
    // Get chat room details to check if it's a care team room
    const { data: roomData, error: roomError } = await supabaseClient
      .from('chat_rooms')
      .select('id, room_type, patient_id')
      .eq('id', roomId)
      .single();
      
    if (roomError) {
      console.error("Error fetching room details:", roomError);
      return new Response(
        JSON.stringify({ error: "Room not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (roomData.room_type !== 'care_team') {
      return new Response(
        JSON.stringify({ error: "AI responses are only available in care team rooms" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Create and send AI response
    let aiResponse = "I'm your healthcare AI assistant. I can help answer general health questions, but please consult with your healthcare providers for medical advice.";
    
    if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
      aiResponse = "Hello! I'm your healthcare AI assistant. How can I help you today?";
    } else if (message.toLowerCase().includes('help')) {
      aiResponse = "I can help answer general health questions, provide information about your care team, or assist with basic healthcare guidance. What do you need help with?";
    } else if (message.toLowerCase().includes('doctor') || message.toLowerCase().includes('appointment')) {
      aiResponse = "Your care team is available to assist you. If you need to schedule an appointment or have specific medical questions, please let your doctor know directly through this chat.";
    } else if (message.toLowerCase().includes('diet') || message.toLowerCase().includes('food') || message.toLowerCase().includes('nutrition')) {
      aiResponse = "For diet and nutrition questions, your nutritionist is here to help. They can provide personalized guidance based on your health needs. Feel free to ask specific questions!";
    } else if (message.toLowerCase().includes('medication') || message.toLowerCase().includes('medicine')) {
      aiResponse = "Medication questions should be directed to your doctor. They can provide accurate information about your prescriptions, dosages, and potential side effects.";
    } else if (message.toLowerCase().includes('thank')) {
      aiResponse = "You're welcome! I'm here to help you and your care team communicate effectively.";
    }
    
    // Insert AI response as a message
    const { data: messageData, error: messageError } = await supabaseClient
      .from('room_messages')
      .insert({
        room_id: roomId,
        sender_id: '00000000-0000-0000-0000-000000000000', // AI bot ID
        message: aiResponse,
        is_ai_message: true
      })
      .select()
      .single();
      
    if (messageError) {
      console.error("Error inserting AI message:", messageError);
      return new Response(
        JSON.stringify({ error: "Failed to send AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: aiResponse,
        messageId: messageData.id
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in care-team-ai-chat:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

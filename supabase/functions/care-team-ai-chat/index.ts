
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// OpenAI API configuration
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the auth context of the request
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { 
          headers: { Authorization: req.headers.get('Authorization')! } 
        } 
      }
    );

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get request body
    const { roomId, message, patientContext } = await req.json();

    if (!roomId || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify the user is a member of this room
    const { data: roomMember, error: roomError } = await supabaseClient
      .from('room_members')
      .select('role')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .single();

    if (roomError || !roomMember) {
      return new Response(
        JSON.stringify({ error: 'Access denied: Not a member of this room' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the patient information for the room
    const { data: roomData, error: roomDataError } = await supabaseClient
      .from('chat_rooms')
      .select('patient_id')
      .eq('id', roomId)
      .single();

    if (roomDataError || !roomData) {
      return new Response(
        JSON.stringify({ error: 'Room not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Save the user's message to the room
    const { data: userMessage, error: messageError } = await supabaseClient.rpc(
      'send_room_message',
      {
        p_room_id: roomId,
        p_message: message
      }
    );

    if (messageError) {
      console.error("Error saving user message:", messageError);
    }

    // Get room message history for context
    const { data: messageHistory, error: historyError } = await supabaseClient.rpc(
      'get_room_messages',
      {
        p_room_id: roomId,
        p_limit: 10
      }
    );

    if (historyError) {
      console.error("Error fetching message history:", historyError);
    }

    // Get patient profile information
    let patientInfo = patientContext || {};
    if (roomData.patient_id && !patientContext) {
      const { data: patientData } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', roomData.patient_id)
        .single();

      if (patientData) {
        patientInfo = {
          name: `${patientData.first_name || ''} ${patientData.last_name || ''}`.trim(),
          ...patientData
        };
      }
    }

    // Format message history for OpenAI
    const formattedHistory = messageHistory ? messageHistory.map(msg => ({
      role: msg.is_ai_message ? "assistant" : "user",
      content: `${msg.is_ai_message ? '' : `${msg.sender_name} (${msg.sender_role}): `}${msg.message}`
    })) : [];

    // Prepare AI chat request
    const aiMessages = [
      {
        role: "system",
        content: `You are an AI healthcare assistant in a care team chat for a patient. 
        Your goal is to provide helpful, accurate, and supportive information to both the patient and healthcare providers.
        
        ${patientInfo ? `Patient information: ${JSON.stringify(patientInfo, null, 2)}` : ''}
        
        Guidelines:
        - Be professional and compassionate
        - Do not diagnose but help clarify medical information
        - When medical questions arise, suggest consulting with the doctor
        - Support both patients and healthcare providers in the conversation
        - For nutrition questions, refer to the nutritionist when possible
        - Always maintain a helpful and supportive tone`
      },
      ...formattedHistory,
      {
        role: "user",
        content: `${roomMember.role || 'User'}: ${message}`
      }
    ];

    // Call OpenAI API
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const openAIResponse = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: aiMessages,
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    const openAIData = await openAIResponse.json();
    
    if (!openAIData.choices || !openAIData.choices[0]) {
      return new Response(
        JSON.stringify({ error: 'Failed to get AI response', details: openAIData }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const aiResponseText = openAIData.choices[0].message.content.trim();

    // Save AI response to the room
    const { data: aiMessageData, error: aiMessageError } = await supabaseClient.rpc(
      'send_room_message',
      {
        p_room_id: roomId,
        p_message: aiResponseText,
        p_is_system_message: false,
        p_is_ai_message: true
      }
    );

    if (aiMessageError) {
      console.error("Error saving AI message:", aiMessageError);
      return new Response(
        JSON.stringify({ error: 'Failed to save AI response', details: aiMessageError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        response: aiResponseText,
        messageId: aiMessageData 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error("Care team AI chat error:", error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

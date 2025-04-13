
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'

// Get environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// Create Supabase client with admin privileges
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const { patient_id, message, title, message_type = 'health_plan' } = await req.json()
    
    if (!patient_id || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields: patient_id, message' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Sending AI message to patient ${patient_id}`)
    
    // Find patient's care team room
    const { data: roomData, error: roomError } = await supabaseAdmin
      .rpc('get_patient_care_team_room', { patient_id })
    
    if (roomError || !roomData) {
      console.error('Error finding care team room:', roomError)
      return new Response(JSON.stringify({ error: 'Failed to find care team room', details: roomError }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    const roomId = roomData
    console.log(`Found care team room: ${roomId}`)
    
    // Send message from AI assistant
    const AI_BOT_ID = '00000000-0000-0000-0000-000000000000'
    
    const messageContent = title ? `**${title}**\n\n${message}` : message
    
    const { data: messageData, error: messageError } = await supabaseAdmin
      .from('room_messages')
      .insert({
        room_id: roomId,
        sender_id: AI_BOT_ID,
        message: messageContent,
        message_type: message_type,
        is_ai_message: true
      })
      .select('id')
    
    if (messageError) {
      console.error('Error sending message:', messageError)
      return new Response(JSON.stringify({ error: 'Failed to send message', details: messageError }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message_id: messageData?.[0]?.id,
      room_id: roomId 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

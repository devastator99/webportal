
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }
  
  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    )

    // Get the request body
    const { type, doctor_id } = await req.json()
    
    if (!doctor_id) {
      return new Response(
        JSON.stringify({ error: "Doctor ID is required" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      )
    }
    
    let data = null
    let error = null
    
    // Call the appropriate RPC function based on the type
    switch (type) {
      case 'patients_count':
        const patientsResult = await supabaseClient.rpc('get_doctor_patients_count', { doctor_id })
        data = patientsResult.data
        error = patientsResult.error
        break
        
      case 'medical_records_count':
        const recordsResult = await supabaseClient.rpc('get_doctor_medical_records_count', { doctor_id })
        data = recordsResult.data
        error = recordsResult.error
        break
        
      case 'todays_appointments_count':
        const todaysResult = await supabaseClient.rpc('get_doctor_todays_appointments_count', { doctor_id })
        data = todaysResult.data
        error = todaysResult.error
        break
        
      case 'upcoming_appointments_count':
        const upcomingResult = await supabaseClient.rpc('get_doctor_upcoming_appointments_count', { doctor_id })
        data = upcomingResult.data
        error = upcomingResult.error
        break
        
      default:
        return new Response(
          JSON.stringify({ error: "Invalid stat type requested" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        )
    }
    
    if (error) {
      console.error(`Error fetching doctor stat ${type}:`, error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      )
    }
    
    // Return the data
    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    )
    
  } catch (error) {
    console.error("Error in doctor stats edge function:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    )
  }
})

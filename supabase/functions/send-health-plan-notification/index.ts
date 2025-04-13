
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'

// Get environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// Create Supabase client with admin privileges
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const { patientId, nutritionistId, planItems } = await req.json()
    
    if (!patientId || !nutritionistId) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get patient and nutritionist details
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name, phone')
      .eq('id', patientId)
      .single()
    
    if (patientError || !patient) {
      console.error('Error fetching patient:', patientError)
      return new Response(JSON.stringify({ error: 'Patient not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { data: nutritionist, error: nutritionistError } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', nutritionistId)
      .single()
    
    if (nutritionistError || !nutritionist) {
      console.error('Error fetching nutritionist:', nutritionistError)
      return new Response(JSON.stringify({ error: 'Nutritionist not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Construct the message
    const itemCount = typeof planItems === 'number' ? planItems : 'multiple'
    const message = `Hello ${patient.first_name},

Your nutritionist ${nutritionist.first_name} ${nutritionist.last_name} has created a personalized health plan for you with ${itemCount} items.

Please log in to view your complete health plan and set up reminders.

Best regards,
Your Healthcare Team`

    // Send WhatsApp notification if phone number is available
    if (patient.phone) {
      try {
        // Use the WhatsApp notification edge function
        await supabaseAdmin.functions.invoke('send-whatsapp-notification', {
          body: {
            to: patient.phone,
            message: message
          }
        })
      } catch (whatsappError) {
        console.error('Error sending WhatsApp notification:', whatsappError)
        // Don't fail the entire operation if WhatsApp notification fails
      }
    }
    
    // Also send a message to the care team chat via AI assistant
    try {
      // Check if health plan items are provided as detailed objects
      let healthPlanDetails = "";
      
      if (Array.isArray(planItems)) {
        const typeEmojis = {
          'food': '🍎',
          'exercise': '🏃‍♂️',
          'medication': '💊'
        };
        
        healthPlanDetails = "\n\n**Health Plan Summary:**\n\n";
        
        // Group by type
        const groupedItems = planItems.reduce((grouped, item) => {
          const type = item.type || 'other';
          if (!grouped[type]) {
            grouped[type] = [];
          }
          grouped[type].push(item);
          return grouped;
        }, {});
        
        // Add each group to the details
        for (const [type, items] of Object.entries(groupedItems)) {
          const emoji = typeEmojis[type as keyof typeof typeEmojis] || '✅';
          healthPlanDetails += `**${type.toUpperCase()}** ${emoji}\n`;
          
          (items as any[]).forEach((item, index) => {
            healthPlanDetails += `${index + 1}. ${item.description} (${item.scheduled_time})\n`;
          });
          
          healthPlanDetails += "\n";
        }
      }
      
      const careTeamMessage = `📢 **New Health Plan Created**

Hello everyone! ${nutritionist.first_name} ${nutritionist.last_name} has just created a new health plan for ${patient.first_name} ${patient.last_name}.${healthPlanDetails}

The patient has been notified via WhatsApp${patient.phone ? '' : ' (no phone number available)'}.`;

      // Send to care team chat
      await fetch(`${SUPABASE_URL}/functions/v1/send-ai-care-team-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          patient_id: patientId,
          message: careTeamMessage,
          message_type: 'health_plan_notification'
        })
      });
      
    } catch (chatError) {
      console.error('Error sending care team chat notification:', chatError);
      // Don't fail the entire operation if chat notification fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Health plan notification sent to ${patient.first_name} ${patient.last_name}` 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error in send-health-plan-notification:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})

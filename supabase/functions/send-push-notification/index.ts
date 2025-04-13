import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'
import webpush from 'https://esm.sh/web-push@3.6.6'

// Configure CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Get environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const VAPID_PUBLIC_KEY = 'BObz8nKixHXF_PxdcJJCDE5joZ3NowjQi6LST2SRl_R_P8DkV6lPmaf-b6Sd62aDyeEVWrV-R4lR9YjXdkqFBQE'
const VAPID_PRIVATE_KEY = 'TTkFcWYkXLYPRmRILvtsXDFt1792bGLKQ2Y2ZcmMvGo'
const VAPID_SUBJECT = 'mailto:mihir.chandra@gmail.com'

// Create Supabase client with service role key for admin access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Configure web-push
webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

interface NotificationPayload {
  title: string
  body: string
  user_id?: string
  type: 'health_plan' | 'appointment' | 'medication' | 'general'
  data?: Record<string, any>
  icon?: string
  badge?: string
  image?: string
  tag?: string
  actions?: Array<{ action: string, title: string, icon?: string }>
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
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    // Parse the request body
    const payload: NotificationPayload = await req.json()
    const { title, body, user_id, type, data = {}, icon, badge, image, tag, actions } = payload

    // Validate required fields
    if (!title || !body || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, body, type' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create a list of users to notify
    let userIds: string[] = []
    
    // If a specific user_id is provided, use it
    if (user_id) {
      userIds = [user_id]
    } else {
      // Get all users that have push subscriptions
      const { data: users, error } = await supabase
        .from('push_subscriptions')
        .select('user_id')
        .is('endpoint', 'not.null')

      if (error) {
        throw error
      }

      // Extract unique user IDs
      userIds = [...new Set(users.map(user => user.user_id))]
    }

    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users to notify' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Process each user
    const results = await Promise.all(
      userIds.map(async (userId) => {
        try {
          // Get user's preferences
          const { data: preferences } = await supabase.rpc(
            'get_user_notification_preferences', 
            { p_user_id: userId }
          )
          
          // Check if this notification type is enabled for the user
          const preferenceKey = `${type}_enabled`
          const isEnabled = preferences?.length > 0 ? preferences[0][preferenceKey] : true
          
          if (!isEnabled) {
            return {
              userId,
              status: 'skipped',
              reason: `User has disabled ${type} notifications`
            }
          }
          
          // Check quiet hours if set
          const quietHoursStart = preferences?.[0]?.quiet_hours_start
          const quietHoursEnd = preferences?.[0]?.quiet_hours_end
          
          if (quietHoursStart && quietHoursEnd) {
            const now = new Date()
            const currentTime = now.getHours() * 60 + now.getMinutes()
            
            let startMinutes = parseInt(quietHoursStart.split(':')[0]) * 60 + 
                              parseInt(quietHoursStart.split(':')[1])
            let endMinutes = parseInt(quietHoursEnd.split(':')[0]) * 60 + 
                            parseInt(quietHoursEnd.split(':')[1])
            
            // Handle overnight quiet hours (e.g., 22:00 - 07:00)
            if (endMinutes < startMinutes) {
              if (currentTime >= startMinutes || currentTime <= endMinutes) {
                return {
                  userId,
                  status: 'skipped',
                  reason: 'Within quiet hours'
                }
              }
            } else if (currentTime >= startMinutes && currentTime <= endMinutes) {
              return {
                userId,
                status: 'skipped',
                reason: 'Within quiet hours'
              }
            }
          }
          
          // Get user's subscriptions
          const { data: subscriptions, error: subError } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', userId)
          
          if (subError) throw subError
          
          if (!subscriptions || subscriptions.length === 0) {
            return {
              userId,
              status: 'skipped',
              reason: 'No push subscriptions found'
            }
          }
          
          // Send notifications to all user's subscriptions
          const subscriptionResults = await Promise.all(
            subscriptions.map(async (sub) => {
              try {
                const subscription = {
                  endpoint: sub.endpoint,
                  keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                  }
                }
                
                const notificationPayload = {
                  title,
                  body,
                  icon: icon || '/favicon.ico',
                  badge: badge,
                  image: image,
                  tag: tag || type,
                  data: {
                    ...data,
                    userId,
                    subscriptionId: sub.id,
                    url: '/'  // Default URL to open
                  },
                  actions: actions || []
                }
                
                // Send the notification
                await webpush.sendNotification(
                  subscription, 
                  JSON.stringify(notificationPayload)
                )
                
                // Log successful notification
                await supabase.rpc('log_notification', {
                  p_user_id: userId,
                  p_subscription_id: sub.id,
                  p_type: type,
                  p_title: title,
                  p_body: body,
                  p_data: data,
                  p_status: 'sent'
                })
                
                return {
                  subscriptionId: sub.id,
                  status: 'sent'
                }
              } catch (error) {
                console.error(`Error sending notification to subscription ${sub.id}:`, error)
                
                // Handle expired or invalid subscriptions
                if (error.statusCode === 404 || error.statusCode === 410) {
                  // Delete the subscription if it's invalid
                  await supabase
                    .from('push_subscriptions')
                    .delete()
                    .eq('id', sub.id)
                  
                  return {
                    subscriptionId: sub.id,
                    status: 'deleted',
                    error: 'Subscription expired or invalid'
                  }
                }
                
                // Log failed notification
                await supabase.rpc('log_notification', {
                  p_user_id: userId,
                  p_subscription_id: sub.id,
                  p_type: type,
                  p_title: title,
                  p_body: body,
                  p_data: data,
                  p_status: 'failed',
                  p_error: error.message
                })
                
                return {
                  subscriptionId: sub.id,
                  status: 'failed',
                  error: error.message
                }
              }
            })
          )
          
          return {
            userId,
            status: 'processed',
            subscriptions: subscriptionResults
          }
        } catch (error) {
          console.error(`Error processing user ${userId}:`, error)
          return {
            userId,
            status: 'error',
            error: error.message
          }
        }
      })
    )

    return new Response(
      JSON.stringify({ success: true, results }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error in push notification function:', error)
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

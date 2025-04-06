
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface MessageData {
  id: string;
  message: string | null;
  message_type: string | null;
  created_at: string;
  read: boolean;
  sender: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  };
  receiver: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  };
}

serve(async (req: Request) => {
  try {
    const { user_id, other_user_id, page = 1, per_page = 50, include_care_team = false } = await req.json();
    
    if (!user_id || !other_user_id) {
      return new Response(
        JSON.stringify({ error: "User ID and other user ID are required" }),
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
    
    // Calculate pagination
    const pageNumber = parseInt(String(page));
    const perPage = parseInt(String(per_page));
    const offset = (pageNumber - 1) * perPage;
    
    let query = supabaseClient
      .from('chat_messages')
      .select(`
        id,
        message,
        message_type,
        created_at,
        read,
        sender:sender_id(id, first_name, last_name),
        receiver:receiver_id(id, first_name, last_name)
      `);
      
    // If including care team messages (for doctors viewing patient messages)
    if (include_care_team) {
      // First get the care team members for this patient
      const { data: careTeamData, error: careTeamError } = await supabaseClient
        .rpc('get_patient_care_team_members', { p_patient_id: other_user_id });
      
      if (careTeamError) {
        return new Response(
          JSON.stringify({ error: careTeamError.message }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      const careTeamIds = careTeamData ? careTeamData.map(member => member.id) : [];
      
      // Add the current user and the patient to the list
      const relevantIds = [user_id, other_user_id, ...careTeamIds];
      
      // Only show messages that involve the care team or between the doctor and patient
      let filterConditions = [];
      
      // Direct messages between doctor and patient
      filterConditions.push(`and(sender_id.eq.${user_id},receiver_id.eq.${other_user_id})`);
      filterConditions.push(`and(sender_id.eq.${other_user_id},receiver_id.eq.${user_id})`);
      
      // Messages between care team members and patient
      for (const id of careTeamIds) {
        if (id !== user_id) {
          filterConditions.push(`and(sender_id.eq.${id},receiver_id.eq.${other_user_id})`);
          filterConditions.push(`and(sender_id.eq.${other_user_id},receiver_id.eq.${id})`);
        }
      }
      
      // Messages between care team members that might be about the patient
      if (careTeamIds.length > 1) {
        for (const senderId of relevantIds) {
          for (const receiverId of relevantIds) {
            if (senderId !== receiverId) {
              filterConditions.push(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId})`);
            }
          }
        }
      }
      
      query = query.or(filterConditions.join(','));
    } else {
      // Regular chat between two users
      query = query.or(`and(sender_id.eq.${user_id},receiver_id.eq.${other_user_id}),and(sender_id.eq.${other_user_id},receiver_id.eq.${user_id})`);
    }
    
    // Get total count first to determine if there are more messages
    const { count, error: countError } = await query.count('id', { head: true });
      
    if (countError) {
      console.error("Error counting chat messages:", countError);
      return new Response(
        JSON.stringify({ error: countError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Get actual messages with pagination
    const { data, error } = await query
      .order('created_at', { ascending: true })
      .range(offset, offset + perPage - 1);
      
    if (error) {
      console.error("Error fetching chat messages:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Determine if there are more messages
    const hasMore = count !== null && count > offset + data.length;
    
    return new Response(
      JSON.stringify({
        messages: data,
        hasMore,
        totalCount: count,
        page: pageNumber,
        perPage
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});


import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface RequestData {
  user_id: string;
  admin_id: string;
}

Deno.serve(async (req) => {
  try {
    // Create a Supabase client with the Auth context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the request body
    const requestData: RequestData = await req.json();
    const { user_id, admin_id } = requestData;

    if (!user_id || !admin_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameters',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // First, check if the calling user is an admin using the RPC function
    const { data: adminCheckData, error: adminCheckError } = await supabaseClient.rpc(
      'check_admin_role',
      { user_id: admin_id }
    );

    if (adminCheckError || !adminCheckData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: adminCheckError?.message || 'Unauthorized: Only administrators can delete users',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Call the database function to handle profile and role deletion
    const { data: deleteData, error: deleteError } = await supabaseClient.rpc(
      'admin_delete_user',
      { p_user_id: user_id, p_admin_id: admin_id }
    );

    if (deleteError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: deleteError.message,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Now delete the user from auth.users using the admin API
    const { error: authDeleteError } = await supabaseClient.auth.admin.deleteUser(user_id);

    if (authDeleteError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: authDeleteError.message,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User deleted successfully',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

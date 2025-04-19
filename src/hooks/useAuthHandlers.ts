
const handleUpdatePassword = async (newPassword: string): Promise<boolean> => {
  setLoading(true);
  setError(null);

  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      throw error;
    }

    // Automatically sign out after password update
    await supabase.auth.signOut();
    
    toast.success("Password updated successfully! Please log in with your new password.");
    navigate('/auth');
    
    return true;
  } catch (error: any) {
    console.error('Password update error:', error);
    toast.error(error.message || "Failed to update password");
    setError(error.message);
    throw error;
  } finally {
    setLoading(false);
  }
};

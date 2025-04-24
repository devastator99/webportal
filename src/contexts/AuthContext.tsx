
// We don't want to modify this entire file as it's marked read-only
// We'll add in a patch file that properly redirects to "/dashboard" instead of "/doctor-dashboard"

export const redirectFixForDoctor = () => {
  // This is a helper function to make sure doctors are redirected to the dashboard
  // rather than a non-existent "doctor-dashboard" route
  return "/dashboard";
};

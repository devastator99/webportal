
/**
 * Returns the appropriate auth redirect URL based on the current environment.
 * This ensures that development and production environments use the correct URLs.
 */
export const getAuthRedirectUrl = (path: string = '/auth'): string => {
  // Get the base URL from the window location
  const baseUrl = window.location.origin;
  
  // Combine with the path
  const fullUrl = `${baseUrl}${path}`;
  
  console.log(`Generated redirect URL: ${fullUrl}`);
  
  return fullUrl;
};

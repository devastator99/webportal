
/**
 * Utilities for handling environment-specific configuration
 * and URL management across different deployment environments.
 */

/**
 * Gets the appropriate base URL for auth redirects based on the current environment
 */
export const getBaseUrl = (): string => {
  // Get the current hostname
  const hostname = window.location.hostname;
  
  // Handle localhost development environment
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${window.location.protocol}//${hostname}:${window.location.port}`;
  }
  
  // Check if we're on a lovable.dev domain - ensure we use this exact domain
  if (hostname.includes('lovable.dev')) {
    return `${window.location.protocol}//${hostname}`;
  }
  
  // Handle production or preview environments with custom domains
  return `${window.location.protocol}//${hostname}`;
};

/**
 * Creates a fully qualified URL for authentication redirects
 * This ensures URLs work correctly across all environments
 */
export const getAuthRedirectUrl = (path: string = '/auth'): string => {
  const baseUrl = getBaseUrl();
  // Ensure path starts with a slash if not already
  const redirectPath = path.startsWith('/') ? path : `/${path}`;
  
  // Log for debugging purposes
  console.log(`Creating auth redirect URL: ${baseUrl}${redirectPath}`);
  return `${baseUrl}${redirectPath}`;
};

/**
 * Generates a URL with query parameters
 */
export const createUrlWithParams = (baseUrl: string, params: Record<string, string>): string => {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  return url.toString();
};

/**
 * Gets the current project ID from the hostname
 * This is useful for constructing domain-specific resources
 */
export const getProjectId = (): string | null => {
  const hostname = window.location.hostname;
  
  // Check if we're on a lovable.dev domain
  if (hostname.includes('lovable.dev')) {
    // Extract the project ID from the subdomain
    const match = hostname.match(/^([a-z0-9-]+)\.lovable\.dev$/);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

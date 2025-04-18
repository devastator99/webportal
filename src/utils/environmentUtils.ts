
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
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  // Handle localhost development environment
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:${port}`;
  }
  
  // Check for preview/staging environments (lovable.dev subdomains)
  if (hostname.includes('lovable.dev')) {
    // This is a lovable.dev preview environment
    console.log(`Detected lovable.dev environment: ${hostname}`);
    return `${protocol}//${hostname}`;
  }
  
  // Check for Netlify preview environments
  if (hostname.includes('netlify.app')) {
    console.log(`Detected Netlify preview environment: ${hostname}`);
    return `${protocol}//${hostname}`;
  }

  // Check for Vercel preview environments
  if (hostname.includes('vercel.app')) {
    console.log(`Detected Vercel preview environment: ${hostname}`);
    return `${protocol}//${hostname}`;
  }
  
  // Handle production or other environments with custom domains
  console.log(`Using production environment URL: ${protocol}//${hostname}`);
  return `${protocol}//${hostname}${port ? ':' + port : ''}`;
};

/**
 * Validates a URL string to ensure it's properly formatted
 * Returns null if invalid, the URL string if valid
 */
export const validateUrl = (url: string): string | null => {
  try {
    // Check if URL is valid by attempting to create a URL object
    new URL(url);
    return url;
  } catch (e) {
    console.error(`Invalid URL detected: ${url}`, e);
    return null;
  }
};

/**
 * Creates a fully qualified URL for authentication redirects
 * This ensures URLs work correctly across all environments
 */
export const getAuthRedirectUrl = (path: string = '/auth'): string => {
  const baseUrl = getBaseUrl();
  // Ensure path starts with a slash if not already
  const redirectPath = path.startsWith('/') ? path : `/${path}`;
  
  const fullRedirectUrl = `${baseUrl}${redirectPath}`;
  
  // Validate the URL before returning
  const validatedUrl = validateUrl(fullRedirectUrl);
  if (!validatedUrl) {
    console.error(`Generated invalid auth redirect URL: ${fullRedirectUrl}`);
    
    // Fallback to origin if we generated an invalid URL
    const fallbackUrl = `${window.location.origin}${redirectPath}`;
    console.log(`Using fallback URL instead: ${fallbackUrl}`);
    return fallbackUrl;
  }
  
  // Log for debugging purposes
  console.log(`Creating auth redirect URL: ${validatedUrl}`);
  return validatedUrl;
};

/**
 * Generates a URL with query parameters
 */
export const createUrlWithParams = (baseUrl: string, params: Record<string, string>): string => {
  try {
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    return url.toString();
  } catch (e) {
    console.error(`Failed to create URL with params from ${baseUrl}:`, e);
    return baseUrl; // Return original URL if parsing fails
  }
};

/**
 * Gets the current project ID from the hostname
 * This is useful for constructing domain-specific resources
 */
export const getProjectId = (): string | null => {
  const hostname = window.location.hostname;
  
  // Check if we're on a lovable.dev domain
  if (hostname.includes('lovable.dev')) {
    // Extract the project ID from the subdomain, including any preview or other variants
    const match = hostname.match(/^([a-z0-9-]+)(-preview|-[a-z0-9]+)?\.lovable\.dev$/);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // Check for other environments where project ID might be available
  // (can be extended for other platforms)
  
  return null;
};

/**
 * Gets information about the current environment for debugging purposes
 */
export const getEnvironmentInfo = (): Record<string, any> => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;
  const origin = window.location.origin;
  const href = window.location.href;
  const baseUrl = getBaseUrl();
  const authRedirectUrl = getAuthRedirectUrl();
  const projectId = getProjectId();

  return {
    environment: import.meta.env.MODE,
    hostname,
    protocol,
    port,
    origin,
    currentUrl: href,
    baseUrl,
    authRedirectUrl,
    projectId,
    validBaseUrl: validateUrl(baseUrl) !== null,
    validRedirectUrl: validateUrl(authRedirectUrl) !== null,
    timestamp: new Date().toISOString(),
  };
};

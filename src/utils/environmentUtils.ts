
/**
 * Utilities for handling environment-specific configuration
 * and URL management across different deployment environments.
 */

const PRODUCTION_URL = 'https://anubhooti-phase1.lovable.app';

/**
 * Gets the appropriate base URL based on the current environment
 */
export const getBaseUrl = (): string => {
  // Get the current hostname
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  // For password reset and auth operations in production, always return production URL
  if (hostname.includes('lovable.app')) {
    return PRODUCTION_URL;
  }
  
  // Handle localhost development environment
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:${port}`;
  }
  
  // Check for preview/staging environments (lovable.dev subdomains)
  if (hostname.includes('lovable.dev')) {
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
  
  // For lovableproject.com environments
  if (hostname.includes('lovableproject.com')) {
    console.log(`Detected lovableproject.com environment: ${hostname}`);
    return `${protocol}//${hostname}`;
  }
  
  // For all other cases in production, use the production URL
  console.log(`Using production URL: ${PRODUCTION_URL}`);
  return PRODUCTION_URL;
};

/**
 * Validates a URL string
 */
export const validateUrl = (url: string): string | null => {
  try {
    new URL(url);
    return url;
  } catch (e) {
    console.error(`Invalid URL detected: ${url}`, e);
    return null;
  }
};

/**
 * Creates a fully qualified URL for authentication redirects
 */
export const getAuthRedirectUrl = (path: string = '/auth'): string => {
  // Get the appropriate base URL for the current environment
  const baseUrl = getBaseUrl();
  const redirectPath = path.startsWith('/') ? path : `/${path}`;
  const fullUrl = `${baseUrl}${redirectPath}`;
  
  console.log(`Creating auth redirect URL: ${fullUrl}`);
  return fullUrl;
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
  
  // Check for lovableproject.com environment
  if (hostname.includes('lovableproject.com')) {
    const match = hostname.match(/^([a-z0-9-]+(-[a-z0-9-]+)?)\.lovableproject\.com$/);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // Check for lovable.app environment
  if (hostname.includes('lovable.app')) {
    const match = hostname.match(/^([a-z0-9-]+(-[a-z0-9-]+)?)\.lovable\.app$/);
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
  const passwordResetUrl = getAuthRedirectUrl('/auth/update-password');
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
    passwordResetUrl,
    projectId,
    validBaseUrl: validateUrl(baseUrl) !== null,
    validRedirectUrl: validateUrl(authRedirectUrl) !== null,
    validPasswordResetUrl: validateUrl(passwordResetUrl) !== null,
    timestamp: new Date().toISOString(),
  };
};

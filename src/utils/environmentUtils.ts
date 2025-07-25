
/**
 * Returns the base URL for the current environment.
 * This is used internally by getEnvironmentInfo.
 */
const getBaseUrl = (): string => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  return `${protocol}//${hostname}${port}`;
};

/**
 * Extracts the Supabase project ID from the environment.
 * This is used internally by getEnvironmentInfo.
 */
const getProjectId = (): string => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const match = supabaseUrl.match(/https:\/\/([a-zA-Z0-9-]+)\.supabase\.co/);
  return match ? match[1] : 'unknown-project';
};

/**
 * Returns comprehensive environment information for debugging.
 */
export const getEnvironmentInfo = (): Record<string, any> => {
  const baseUrl = getBaseUrl();
  const isDev = import.meta.env.DEV || window.location.hostname === 'localhost';
  const isLovableApp = window.location.hostname.includes('lovable.app');
  const isNetlify = window.location.hostname.includes('netlify.app');
  const projectId = getProjectId();
  
  return {
    baseUrl,
    isDev,
    isLovableApp,
    isNetlify,
    projectId,
    hostname: window.location.hostname,
    pathname: window.location.pathname,
    protocol: window.location.protocol,
    port: window.location.port || 'default',
    fullUrl: window.location.href,
    search: window.location.search,
    hash: window.location.hash,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Returns the appropriate auth redirect URL based on the current environment.
 */
export const getAuthRedirectUrl = (path: string = '/auth'): string => {
  return getSiteUrl() + path;
};

/**
 * Returns the site URL to use for Supabase redirects.
 * This ensures consistency across all auth operations and handles different environments.
 */
export const getSiteUrl = (): string => {
  const origin = window.location.origin;
  
  // Log for debugging
  console.log('[Environment] Site URL:', origin);
  
  return origin;
};

/**
 * Returns the correct password reset redirect URL.
 * This ensures the URL format matches what Supabase expects.
 */
export const getPasswordResetRedirectUrl = (): string => {
  const siteUrl = getSiteUrl();
  const redirectPath = '/update-password';
  const fullUrl = `${siteUrl}${redirectPath}`;
  
  console.log('[Environment] Password reset redirect URL:', fullUrl);
  
  return fullUrl;
};

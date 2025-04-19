
/**
 * Returns the base URL for the current environment.
 */
export const getBaseUrl = (): string => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  return `${protocol}//${hostname}${port}`;
};

/**
 * Extracts the Supabase project ID from the environment.
 */
export const getProjectId = (): string => {
  // Extract project ID from Supabase URL if available
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

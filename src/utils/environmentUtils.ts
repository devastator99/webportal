
export const getBaseUrl = (): string => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  return `${protocol}//${hostname}${port}`;
};

export const getProjectId = (): string => {
  // Extract project ID from Supabase URL if available
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const match = supabaseUrl.match(/https:\/\/([a-zA-Z0-9-]+)\.supabase\.co/);
  return match ? match[1] : 'unknown-project';
};

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

export const getAuthRedirectUrl = (path: string = '/auth'): string => {
  const baseUrl = getBaseUrl();
  const fullOrigin = window.location.origin;
  const redirectPath = path.startsWith('/') ? path : `/${path}`;
  
  // For auth redirects, always include view parameter for password reset flow
  const queryParams = path.includes('?') ? '' : '?view=update_password';
  
  // Using origin instead of baseUrl for more reliable behavior
  const fullUrl = `${fullOrigin}${redirectPath}${queryParams}`;
  
  console.log(`Creating auth redirect URL: ${fullUrl}`);
  return fullUrl;
};

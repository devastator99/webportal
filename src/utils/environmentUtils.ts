
export const getAuthRedirectUrl = (path: string = '/auth/update-password'): string => {
  const baseUrl = getBaseUrl();
  const redirectPath = path.startsWith('/') ? path : `/${path}`;
  
  const fullUrl = `${baseUrl}${redirectPath}`;
  
  console.log(`Creating auth redirect URL: ${fullUrl}`);
  return fullUrl;
};

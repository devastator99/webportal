
useEffect(() => {
  const envInfo = getEnvironmentInfo();
  const pathname = location.pathname;
  const hash = window.location.hash;
  const search = window.location.search;
  const urlParams = new URLSearchParams(search);
  const type = urlParams.get('type');
  
  console.log("SupabaseAuthUI - URL recovery detection:", { 
    pathname, 
    hash, 
    type,
    envInfo 
  });
  
  const isPasswordReset = 
    pathname === '/auth/update-password' ||
    (hash && hash.includes('type=recovery')) || 
    (type === 'recovery');
  
  if (isPasswordReset && view !== 'update_password') {
    console.log("Setting view to update_password due to recovery flow detection");
    setCurrentView('update_password');
  }
}, [view, location]);

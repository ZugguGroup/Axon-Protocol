const routes = {};

export function register(name, renderFn) {
  routes[name] = renderFn;
}

export function navigate(page) {
  window.location.hash = `#/${page}`;
}

export function start(defaultPage = 'dashboard') {
  function handleRoute() {
    const userToken = localStorage.getItem('axon_user_token');
    let hash = window.location.hash.replace('#/', '');
    
    // Normalize hash or use default
    if (!hash || hash === '/') {
      hash = userToken ? defaultPage : 'landing';
    }

    if (!userToken) {
      if (hash !== 'login' && hash !== 'landing' && hash !== 'docs') {
        window.location.hash = '#/landing';
        return;
      }
    } else {
      if (hash === 'login' || hash === 'landing') {
        window.location.hash = `#/${defaultPage}`;
        return;
      }
      
      const activeKey = localStorage.getItem('axon_api_key');
      const activeProject = localStorage.getItem('axon_project_id');
      if ((!activeKey || !activeProject) && hash !== 'projects' && hash !== 'billing') {
        window.location.hash = '#/projects';
        return;
      }
    }

    const renderFn = routes[hash];
    if (renderFn) {
      renderFn();
    } else if (hash === 'login' || hash === 'landing' || hash === 'docs' || hash === 'projects' || hash === 'billing') {
      // If route registered dynamically late
      console.warn(`Route render function for ${hash} not found yet.`);
    }
  }

  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

export function currentRoute() {
  const userToken = localStorage.getItem('axon_user_token');
  if (!userToken) {
    const hash = window.location.hash.replace('#/', '');
    return (hash === 'login' || hash === 'landing' || hash === 'docs') ? hash : 'landing';
  }
  
  const hash = window.location.hash.replace('#/', '') || 'dashboard';
  const activeProject = localStorage.getItem('axon_project_id');
  if (!activeProject && hash !== 'projects' && hash !== 'billing') {
    return 'projects';
  }
  return hash;
}

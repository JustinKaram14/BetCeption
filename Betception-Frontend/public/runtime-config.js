window.__BETCEPTION_CONFIG__ = {
  apiBaseUrl: ['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'http://localhost:3000'
    : 'https://betception-production.up.railway.app',
  includeCredentials: true,
};

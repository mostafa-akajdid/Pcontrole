const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'DELETE', 'PATCH']);

function getCsrfToken() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

if (typeof window !== 'undefined' && !window.__csrfFetchPatched) {
  window.__csrfFetchPatched = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async function csrfFetch(input, init = {}) {
    const method = (init.method || 'GET').toUpperCase();
    const csrfToken = getCsrfToken();

    if (STATE_CHANGING_METHODS.has(method) && csrfToken) {
      init.headers = {
        ...init.headers,
        'X-CSRF-Token': csrfToken,
      };
    }

    return originalFetch(input, init);
  };
}

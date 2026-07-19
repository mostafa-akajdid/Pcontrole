import { useState, useCallback, useRef, useEffect } from 'react';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  const request = useCallback(async (url, options = {}) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const { headers: customHeaders, body: requestBody, ...restOptions } = options;
      const isFormData = requestBody instanceof FormData;
      const response = await fetch(url, {
        headers: {
          ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
          ...customHeaders,
        },
        body: requestBody,
        ...restOptions,
        signal: controller.signal,
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        if (!response.ok) {
          throw new Error(text || 'Request failed');
        }
        return { success: true, data: text };
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (err) {
      if (err.name === 'AbortError') return null;
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((url) => request(url), [request]);

  const post = useCallback((url, body) => request(url, {
    method: 'POST',
    body: JSON.stringify(body),
  }), [request]);

  const put = useCallback((url, body) => request(url, {
    method: 'PUT',
    body: JSON.stringify(body),
  }), [request]);

  const del = useCallback((url) => request(url, {
    method: 'DELETE',
  }), [request]);

  return { loading, error, request, get, post, put, del };
}

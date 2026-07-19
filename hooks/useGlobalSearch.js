import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;
const RECENT_SEARCHES_KEY = 'taskily_recent_searches';
const MAX_RECENT = 8;

function getRecentSearches() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query) {
  if (typeof window === 'undefined' || !query.trim()) return;
  try {
    const recent = getRecentSearches().filter((r) => r !== query.trim());
    recent.unshift(query.trim());
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch {
    // Ignore storage errors
  }
}

function clearRecentSearches() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Ignore
  }
}

export function useGlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  const fetchResults = useCallback(async (searchQuery) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }

    if (!searchQuery || searchQuery.trim().length < MIN_QUERY_LENGTH) {
      setResults(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await fetch(`/api/search?search=${encodeURIComponent(searchQuery.trim())}`, {
        signal: controller.signal,
      });
      const data = await res.json();
      if (data.success && !controller.signal.aborted) {
        setResults(data.data);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setResults(null);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const updateQuery = useCallback((value) => {
    setQuery(value);
    setSelectedIndex(-1);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!value || value.trim().length < MIN_QUERY_LENGTH) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      fetchResults(value);
    }, DEBOUNCE_MS);
  }, [fetchResults]);

  const addRecentSearch = useCallback((searchQuery) => {
    if (searchQuery?.trim()) {
      saveRecentSearch(searchQuery);
      setRecentSearches(getRecentSearches());
    }
  }, []);

  const removeRecentSearch = useCallback((searchQuery) => {
    if (typeof window === 'undefined') return;
    try {
      const recent = getRecentSearches().filter((r) => r !== searchQuery);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent));
      setRecentSearches(recent);
    } catch {
      // Ignore
    }
  }, []);

  const clearAllRecent = useCallback(() => {
    clearRecentSearches();
    setRecentSearches([]);
  }, []);

  const flatResults = useMemo(() => results?.groups
    ? Object.values(results.groups).flat()
    : [], [results]);

  const selectNext = useCallback(() => {
    setSelectedIndex((prev) => (prev < flatResults.length - 1 ? prev + 1 : 0));
  }, [flatResults.length]);

  const selectPrev = useCallback(() => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatResults.length - 1));
  }, [flatResults.length]);

  const reset = useCallback(() => {
    setQuery('');
    setResults(null);
    setLoading(false);
    setSelectedIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return {
    query,
    setQuery: updateQuery,
    results,
    loading,
    recentSearches,
    selectedIndex,
    setSelectedIndex,
    flatResults,
    selectNext,
    selectPrev,
    addRecentSearch,
    removeRecentSearch,
    clearAllRecent,
    reset,
  };
}

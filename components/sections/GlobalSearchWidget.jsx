import { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, Newspaper } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useAppearance } from '@/contexts/AppearanceContext';

export default function GlobalSearchWidget() {
  const { accentColor } = useAppearance();
  const { get } = useApi();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults(null);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const projectsRes = await get(`/api/projects?search=${encodeURIComponent(query)}&perPage=3`);
        const blogsRes = await get(`/api/blogs?search=${encodeURIComponent(query)}&perPage=3`);
        
        setResults({
          projects: projectsRes?.data?.items || [],
          blogs: blogsRes?.data?.items || [],
        });
      } catch {
        setResults({ projects: [], blogs: [] });
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, get]);

  const totalResults = (results?.projects?.length || 0) + (results?.blogs?.length || 0);

  return (
    <div className="relative">
      <div 
        className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-4 py-2.5 shadow-sm focus-within:shadow-md focus-within:border-gray-200 dark:focus-within:border-gray-600 transition-all"
      >
        <Search size={16} className="text-gray-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search projects, blogs, media..."
          className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults(null);
              setOpen(false);
              inputRef.current?.blur();
            }}
            className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X size={14} className="text-gray-400" />
          </button>
        )}
      </div>

      {open && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden z-50">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-400">Searching...</div>
          ) : results && totalResults === 0 ? (
            <div className="p-4 text-center text-sm text-gray-400">No results found</div>
          ) : results ? (
            <div className="max-h-80 overflow-y-auto">
              {results.projects.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-gray-400 font-medium border-b border-gray-50 dark:border-gray-700">
                    Projects
                  </div>
                  {results.projects.map((p) => (
                    <a
                      key={p.id}
                      href={`/dashboard/projects/${p.id}`}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => { setOpen(false); setQuery(''); }}
                    >
                      <FileText size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{p.title}</span>
                    </a>
                  ))}
                </div>
              )}
              {results.blogs.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-gray-400 font-medium border-b border-gray-50 dark:border-gray-700">
                    Blog Posts
                  </div>
                  {results.blogs.map((b) => (
                    <a
                      key={b.id}
                      href={`/dashboard/blogs/${b.id}`}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => { setOpen(false); setQuery(''); }}
                    >
                      <Newspaper size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{b.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ) : null}
          <button
            onClick={() => setOpen(false)}
            className="w-full px-4 py-2 text-[10px] text-gray-400 border-t border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}

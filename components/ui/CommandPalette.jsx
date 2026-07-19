import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Search, X, Clock, Trash2, FolderKanban, FileText, Image, Users, Shield, Tag, Activity, ArrowRight, Loader2, Command } from 'lucide-react';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { usePermission } from '@/hooks/usePermission';

const GROUP_CONFIG = {
  projects: { label: 'Projects', icon: FolderKanban, color: 'text-blue-500' },
  blogs: { label: 'Blog Posts', icon: FileText, color: 'text-green-500' },
  media: { label: 'Media', icon: Image, color: 'text-purple-500' },
  users: { label: 'Users', icon: Users, color: 'text-amber-500' },
  roles: { label: 'Roles', icon: Shield, color: 'text-red-500' },
  categories: { label: 'Categories', icon: Tag, color: 'text-teal-500' },
  activity: { label: 'Activity', icon: Activity, color: 'text-gray-500' },
};

const STATUS_BADGE = {
  PUBLISHED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  DRAFT: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  INACTIVE: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  SUSPENDED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function highlightMatch(text, query) {
  if (!query || !text) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-200 dark:bg-yellow-800/50 rounded px-0.5">{part}</mark>
    ) : (
      part
    )
  );
}

export default function CommandPalette({ isOpen, onClose }) {
  const router = useRouter();
  const { can } = usePermission();
  const {
    query,
    setQuery,
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
  } = useGlobalSearch();

  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform));
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      reset();
    }
  }, [isOpen, reset]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }

    function handleGlobalKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isOpen, onClose]);

  const handleInputKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectNext();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectPrev();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && flatResults[selectedIndex]) {
        navigateToResult(flatResults[selectedIndex]);
      } else if (query.trim()) {
        addRecentSearch(query);
      }
    }
  }, [selectedIndex, flatResults, query, selectNext, selectPrev, addRecentSearch]);

  const navigateToResult = useCallback((item) => {
    addRecentSearch(query);
    onClose();
    reset();
    if (item.href) {
      router.push(item.href);
    }
  }, [query, addRecentSearch, onClose, reset, router]);

  const handleRecentClick = useCallback((search) => {
    setQuery(search);
    inputRef.current?.focus();
  }, [setQuery]);

  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const el = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const hasResults = flatResults.length > 0;
  const hasQuery = query.trim().length >= 2;
  const showRecent = !hasQuery && recentSearches.length > 0;

  let runningIndex = -1;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-commandPalette">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          {loading ? (
            <Loader2 size={18} className="text-gray-400 animate-spin flex-shrink-0" />
          ) : (
            <Search size={18} className="text-gray-400 flex-shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search projects, blogs, users, media..."
            className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            >
              <X size={14} className="text-gray-400" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[60vh] overflow-y-auto">
          {showRecent && (
            <div className="p-3">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Recent Searches</span>
                <button
                  onClick={clearAllRecent}
                  className="text-[10px] text-gray-400 hover:text-red-500 transition-colors"
                >
                  Clear all
                </button>
              </div>
              {recentSearches.map((search) => (
                <button
                  key={search}
                  onClick={() => handleRecentClick(search)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                >
                  <Clock size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="flex-1 text-left text-sm text-gray-600 dark:text-gray-300">{search}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeRecentSearch(search); }}
                    className="p-0.5 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={12} className="text-gray-400" />
                  </button>
                </button>
              ))}
            </div>
          )}

          {hasQuery && !loading && !hasResults && (
            <div className="text-center py-12">
              <Search size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">No results for "{query}"</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Try different keywords</p>
            </div>
          )}

          {hasQuery && loading && (
            <div className="text-center py-12">
              <Loader2 size={24} className="mx-auto text-gray-400 animate-spin mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">Searching...</p>
            </div>
          )}

          {hasResults && results?.groups && Object.entries(results.groups).map(([groupKey, items]) => {
            if (!items || items.length === 0) return null;
            const config = GROUP_CONFIG[groupKey];
            if (!config) return null;

            if (!can(getGroupPermission(groupKey))) return null;

            const GroupIcon = config.icon;

            return (
              <div key={groupKey} className="py-2">
                <div className="flex items-center gap-2 px-4 py-1.5">
                  <GroupIcon size={12} className={config.color} />
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">{config.label}</span>
                  <span className="text-[10px] text-gray-300 dark:text-gray-600">{items.length}</span>
                </div>
                {items.map((item) => {
                  runningIndex++;
                  const currentIndex = runningIndex;
                  const isSelected = currentIndex === selectedIndex;

                  return (
                    <button
                      key={`${groupKey}-${item.id}`}
                      data-index={currentIndex}
                      onClick={() => navigateToResult(item)}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${
                        isSelected
                          ? 'bg-gray-50 dark:bg-gray-800'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-gray-100 dark:bg-gray-700' : 'bg-gray-50 dark:bg-gray-800'
                      }`}>
                        <GroupIcon size={14} className={config.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                          {highlightMatch(item.title, query)}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                          {highlightMatch(item.subtitle, query)}
                        </p>
                      </div>
                      {item.meta?.status && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_BADGE[item.meta.status] || ''}`}>
                          {item.meta.status}
                        </span>
                      )}
                      {isSelected && (
                        <ArrowRight size={14} className="text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}

          {!hasQuery && !showRecent && (
            <div className="text-center py-12">
              <Command size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">Type to search across the CMS</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Projects, blogs, media, users, and more</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3 text-[10px] text-gray-400">
            <span className="flex items-center gap-1">
              <kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">↑↓</kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">↵</kbd> open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">esc</kbd> close
            </span>
          </div>
          {hasResults && (
            <span className="text-[10px] text-gray-400">{flatResults.length} result{flatResults.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function getGroupPermission(groupKey) {
  switch (groupKey) {
    case 'projects': return 'projects.read';
    case 'blogs': return 'blogs.read';
    case 'media': return 'media.read';
    case 'users': return 'users.read';
    case 'roles': return 'roles.read';
    case 'categories': return 'projects.read';
    case 'activity': return 'projects.read';
    default: return null;
  }
}

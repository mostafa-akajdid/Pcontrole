import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Search,
  Upload,
  Check,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  File,
  Film,
  FileText,
  FolderOpen,
  Plus,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useAppearance } from '@/contexts/AppearanceContext';
import { useToast } from '@/contexts/ToastContext';
import { formatFileSize, IMAGE_FORMATS, VIDEO_FORMATS } from '@/lib/utils';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function getFormatIcon(format) {
  const f = format?.toLowerCase() || '';
  if (IMAGE_FORMATS.includes(f)) return ImageIcon;
  if (VIDEO_FORMATS.includes(f)) return Film;
  if (['pdf'].includes(f)) return FileText;
  return File;
}

export default function MediaPicker({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  accept = 'all',
  title = 'Media Library',
}) {
  const { accentColor } = useAppearance();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [isClosing, setIsClosing] = useState(false);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, perPage: 24, total: 0, totalPages: 1, hasNext: false, hasPrev: false });

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [formatFilter, setFormatFilter] = useState('');
  const [folderFilter, setFolderFilter] = useState('');
  const [folders, setFolders] = useState([]);
  const [viewMode, setViewMode] = useState('grid');

  const [selectedIds, setSelectedIds] = useState([]);
  const [error, setError] = useState(null);

  const [uploadAltText, setUploadAltText] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadFolder, setUploadFolder] = useState('general');

  const abortRef = useRef(null);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const fetchMedia = useCallback(async (overrides = {}) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const page = overrides.page ?? pagination.page;
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('perPage', '24');
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (formatFilter) params.set('format', formatFilter);
      if (folderFilter) params.set('folder', folderFilter);

      const res = await fetch(`/api/media/picker?${params.toString()}`, { signal: controller.signal });
      const json = await res.json();
      if (json.success) {
        setMedia(json.data.items || []);
        setPagination(json.data.pagination || pagination);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError('Failed to load media');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, debouncedSearch, formatFilter, folderFilter]);

  const fetchFolders = useCallback(async () => {
    try {
      const res = await fetch('/api/media/folders');
      const json = await res.json();
      if (json.success) {
        setFolders(Array.isArray(json.data) ? json.data : []);
      }
    } catch (e) {
      console.warn('Failed to load media folders:', e);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchMedia({ page: 1 });
      fetchFolders();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
  }, [debouncedSearch, formatFilter, folderFilter, isOpen]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    let uploadedCount = 0;

    for (const file of files) {
      try {
        const dataUri = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await fetch('/api/media/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file: dataUri,
            altText: uploadAltText || undefined,
            caption: uploadCaption || undefined,
            folder: uploadFolder || undefined,
          }),
        });

        const json = await res.json();
        if (json.success) {
          uploadedCount++;
          if (multiple) {
            setSelectedIds((prev) => [...prev, json.data.id]);
          }
        } else {
          toast.error(json.message || `Failed to upload ${file.name}`);
        }
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    if (uploadedCount > 0) {
      toast.success(`${uploadedCount} file(s) uploaded`);
      fetchMedia({ page: 1 });
      fetchFolders();
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleToggleSelect = (id) => {
    if (multiple) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    } else {
      setSelectedIds((prev) => (prev[0] === id ? [] : [id]));
    }
  };

  const handleConfirm = () => {
    const selectedMedia = media.filter((m) => selectedIds.includes(m.id));
    onSelect(multiple ? selectedMedia : selectedMedia[0] || null);
    setSelectedIds([]);
    handleClose();
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setSelectedIds([]);
      setSearch('');
      setFormatFilter('');
      setFolderFilter('');
    }, 300);
  };

  if (!isOpen && !isClosing) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-[100] transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
      />

      <div
        className={`fixed inset-4 sm:inset-8 lg:inset-12 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-[101] flex flex-col overflow-hidden transition-all duration-300 ${
          isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedIds.length > 0
                ? `${selectedIds.length} file${selectedIds.length !== 1 ? 's' : ''} selected`
                : 'Select files from your media library'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple={multiple}
              accept="image/*,video/*,.pdf,.doc,.docx,.txt"
              onChange={handleUpload}
              className="hidden"
            />
            <Button
              variant="primary"
              size="sm"
              icon={Upload}
              loading={uploading}
              onClick={() => fileInputRef.current?.click()}
              style={{ backgroundColor: accentColor }}
            >
              Upload Files
            </Button>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, alt text, caption, folder..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-0"
                style={{ focusRingColor: accentColor }}
              />
            </div>
            <Select
              options={[
                { value: '', label: 'All Formats' },
                { value: 'jpg', label: 'JPEG' },
                { value: 'png', label: 'PNG' },
                { value: 'gif', label: 'GIF' },
                { value: 'webp', label: 'WebP' },
                { value: 'svg', label: 'SVG' },
                { value: 'mp4', label: 'MP4' },
                { value: 'pdf', label: 'PDF' },
              ]}
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="min-w-[130px]"
            />
            <Select
              options={[
                { value: '', label: 'All Folders' },
                ...folders.map((f) => ({ value: f.name, label: `${f.name} (${f.count})` })),
              ]}
              value={folderFilter}
              onChange={(e) => setFolderFilter(e.target.value)}
              className="min-w-[130px]"
            />
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 gap-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-600 shadow text-gray-800 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-gray-600 shadow text-gray-800 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : media.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <FolderOpen size={36} className="text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                {debouncedSearch || formatFilter || folderFilter ? 'No files found' : 'No media yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                {debouncedSearch || formatFilter || folderFilter
                  ? 'Try adjusting your search or filters.'
                  : 'Upload your first file to get started.'}
              </p>
              {!debouncedSearch && !formatFilter && !folderFilter && (
                <Button
                  variant="primary"
                  icon={Upload}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ backgroundColor: accentColor }}
                >
                  Upload Files
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {media.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const FormatIcon = getFormatIcon(item.format);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleSelect(item.id)}
                    className={`group relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:shadow-md ${
                      isSelected
                        ? 'border-opacity-100 ring-2 ring-offset-2 dark:ring-offset-gray-900'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    style={
                      isSelected
                        ? { borderColor: accentColor, '--tw-ring-color': accentColor }
                        : {}
                    }
                  >
                    <div className="aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      {IMAGE_FORMATS.includes(item.format) ? (
                        <img
                          src={item.url}
                          alt={item.altText || item.fileName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FormatIcon size={32} className="text-gray-400 dark:text-gray-500" />
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <div
                        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: accentColor }}
                      >
                        <Check size={14} />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-white text-xs font-medium truncate">{item.fileName}</p>
                      <p className="text-white/70 text-[10px]">{formatFileSize(item.fileSize)} &middot; {item.format?.toUpperCase()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase w-10" />
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Preview</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Format</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Size</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Dimensions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {media.map((item) => {
                    const isSelected = selectedIds.includes(item.id);
                    const FormatIcon = getFormatIcon(item.format);
                    return (
                      <tr
                        key={item.id}
                        onClick={() => handleToggleSelect(item.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(item.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      {IMAGE_FORMATS.includes(item.format) ? (
                              <img src={item.url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <FormatIcon size={18} className="text-gray-400" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-800 dark:text-white truncate max-w-[200px]">{item.fileName}</p>
                          {item.altText && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{item.altText}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-500 dark:text-gray-400 uppercase">{item.format}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(item.fileSize)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {item.width && item.height ? `${item.width}×${item.height}` : '-'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {pagination.totalPages > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={ChevronLeft}
                    disabled={!pagination.hasPrev}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={ChevronRight}
                    iconPosition="right"
                    disabled={!pagination.hasNext}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  />
                </>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirm}
                disabled={selectedIds.length === 0}
                style={{ backgroundColor: accentColor }}
              >
                {multiple
                  ? `Select ${selectedIds.length} file${selectedIds.length !== 1 ? 's' : ''}`
                  : 'Select File'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

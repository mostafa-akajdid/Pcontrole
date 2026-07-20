import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Trash2,
  Edit2,
  Upload,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  X,
  Image as ImageIcon,
  Film,
  File,
  FileText,
  Copy,
  Folder,
  RotateCcw,
  Move,
  HardDrive,
  BarChart3,
  AlertTriangle,
  Archive,
  Layers,
  CheckCircle,
  Loader2,
  Zap,
  Cloud,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import { useAppearance } from '@/contexts/AppearanceContext';
import { useToast } from '@/contexts/ToastContext';
import { formatFileSize, IMAGE_FORMATS, VIDEO_FORMATS, formatDateShort } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

function getFormatIcon(format) {
  const f = format?.toLowerCase() || '';
  if (IMAGE_FORMATS.includes(f)) return ImageIcon;
  if (VIDEO_FORMATS.includes(f)) return Film;
  if (['pdf'].includes(f)) return FileText;
  return File;
}

const UPLOAD_STEPS = [
  { key: 'uploading', label: 'Uploading...', icon: Upload },
  { key: 'compressing', label: 'Compressing...', icon: HardDrive },
  { key: 'optimizing', label: 'Optimizing...', icon: Zap },
  { key: 'cloudinary', label: 'Uploading to Cloudinary...', icon: Cloud },
  { key: 'completed', label: 'Completed', icon: CheckCircle },
];

export default function MediaPage() {
  const { accentColor } = useAppearance();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, perPage: 24, total: 0, totalPages: 1, hasNext: false, hasPrev: false });
  const [stats, setStats] = useState({ total: 0, images: 0, videos: 0, documents: 0, totalSize: 0, trashCount: 0, averageFileSize: 0, webpCount: 0 });
  const [trashStats, setTrashStats] = useState({ count: 0, totalSize: 0 });
  const [folders, setFolders] = useState([]);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [formatFilter, setFormatFilter] = useState('');
  const [folderFilter, setFolderFilter] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid');
  const [activeTab, setActiveTab] = useState('library');

  const [selectedIds, setSelectedIds] = useState([]);
  const [detailItem, setDetailItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ altText: '', caption: '', fileName: '', folder: '' });

  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, item: null, permanent: false });
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkPermanentConfirm, setBulkPermanentConfirm] = useState(false);
  const [moveConfirm, setMoveConfirm] = useState(false);
  const [moveFolder, setMoveFolder] = useState('');
  const [restoreConfirm, setRestoreConfirm] = useState({ open: false, item: null });
  const [deleteAllUnusedConfirm, setDeleteAllUnusedConfirm] = useState(false);

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
      params.set('sort', sort);
      params.set('order', order);
      if (activeTab === 'trash') params.set('trash', 'true');
      if (activeTab === 'unused') params.set('unused', 'true');

      const res = await fetch(`/api/media?${params.toString()}`, { signal: controller.signal });
      const json = await res.json();
      if (json.success) {
        setMedia(json.data.items || []);
        setPagination(json.data.pagination || pagination);
      } else {
        setError(json.message || 'Failed to load media');
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError('Failed to load media');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, debouncedSearch, formatFilter, folderFilter, sort, order, activeTab]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/media/stats');
      const json = await res.json();
      if (json.success) {
        setStats(json.data.stats);
        setTrashStats(json.data.trashStats || { count: 0, totalSize: 0 });
        setFolders(json.data.folders || []);
      }
    } catch (e) {
      console.warn('Failed to load media stats/folders:', e);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearch, formatFilter, folderFilter, sort, order, activeTab]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress({ current: 0, total: files.length });
    let uploadedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress({ current: i + 1, total: files.length });

      try {
        setUploadStep('uploading');
        await new Promise((r) => setTimeout(r, 200));

        const dataUri = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        setUploadStep('compressing');
        await new Promise((r) => setTimeout(r, 150));

        setUploadStep('optimizing');
        await new Promise((r) => setTimeout(r, 150));

        setUploadStep('cloudinary');

        const res = await fetch('/api/media/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: dataUri, folder: folderFilter || undefined }),
        });

        const json = await res.json();
        if (json.success) {
          uploadedCount++;
          setUploadStep('completed');
          await new Promise((r) => setTimeout(r, 300));
        } else {
          toast.error(json.message || `Failed to upload ${file.name}`);
          setUploadStep(null);
        }
      } catch {
        toast.error(`Failed to upload ${file.name}`);
        setUploadStep(null);
      }
    }

    if (uploadedCount > 0) {
      toast.success(`${uploadedCount} file(s) uploaded`);
      fetchMedia({ page: 1 });
      fetchStats();
    }
    setUploading(false);
    setUploadStep(null);
    setUploadProgress({ current: 0, total: 0 });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (item, permanent = false) => {
    try {
      const url = permanent
        ? `/api/media/${item.id}?permanent=true`
        : `/api/media/${item.id}`;
      const res = await fetch(url, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success(permanent ? 'File permanently deleted' : 'File moved to trash');
        setDeleteConfirm({ open: false, item: null, permanent: false });
        setDetailItem(null);
        fetchMedia();
        fetchStats();
      } else {
        toast.error(json.message || 'Failed to delete');
      }
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleRestore = async (item) => {
    try {
      const res = await fetch('/api/media/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [item.id], action: 'restore' }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('File restored');
        setRestoreConfirm({ open: false, item: null });
        setDetailItem(null);
        fetchMedia();
        fetchStats();
      } else {
        toast.error(json.message || 'Failed to restore');
      }
    } catch {
      toast.error('Failed to restore');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch('/api/media/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, action: 'delete' }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Files moved to trash');
        setSelectedIds([]);
        setBulkDeleteConfirm(false);
        fetchMedia();
        fetchStats();
      } else {
        toast.error(json.message || 'Failed to delete');
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  const handleBulkPermanentDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch('/api/media/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, action: 'permanentDelete' }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Files permanently deleted');
        setSelectedIds([]);
        setBulkPermanentConfirm(false);
        fetchMedia();
        fetchStats();
      } else {
        toast.error(json.message || 'Failed to permanently delete');
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch('/api/media/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, action: 'restore' }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Files restored');
        setSelectedIds([]);
        fetchMedia();
        fetchStats();
      } else {
        toast.error(json.message || 'Failed to restore');
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  const handleBulkMove = async () => {
    if (selectedIds.length === 0 || !moveFolder.trim()) return;
    try {
      const res = await fetch('/api/media/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, action: 'move', folder: moveFolder }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Files moved');
        setSelectedIds([]);
        setMoveConfirm(false);
        setMoveFolder('');
        fetchMedia();
        fetchStats();
      } else {
        toast.error(json.message || 'Failed to move');
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  const handleDeleteAllUnused = async () => {
    try {
      const res = await fetch('/api/media?unused=true&perPage=1000');
      const json = await res.json();
      if (!json.success || !json.data.items?.length) {
        toast.success('No unused files found');
        setDeleteAllUnusedConfirm(false);
        return;
      }
      const ids = json.data.items.map((m) => m.id);
      const bulkRes = await fetch('/api/media/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'delete' }),
      });
      const bulkJson = await bulkRes.json();
      if (bulkJson.success) {
        toast.success(`${ids.length} unused file(s) moved to trash`);
        setDeleteAllUnusedConfirm(false);
        fetchMedia();
        fetchStats();
      } else {
        toast.error(bulkJson.message || 'Failed to delete unused files');
      }
    } catch {
      toast.error('Failed to delete unused files');
    }
  };

  const handleUpdateMeta = async () => {
    if (!editingItem) return;
    try {
      const res = await fetch(`/api/media/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Media updated');
        setEditingItem(null);
        setDetailItem(null);
        fetchMedia();
      } else {
        toast.error(json.message || 'Failed to update');
      }
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  const handleCopyPublicId = (publicId) => {
    navigator.clipboard.writeText(publicId);
    toast.success('Public ID copied to clipboard');
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (selectedIds.length === media.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(media.map((m) => m.id));
    }
  };

  const sortOptions = [
    { value: 'createdAt:desc', label: 'Newest First' },
    { value: 'createdAt:asc', label: 'Oldest First' },
    { value: 'fileName:asc', label: 'Name A-Z' },
    { value: 'fileName:desc', label: 'Name Z-A' },
    { value: 'fileSize:desc', label: 'Largest First' },
    { value: 'fileSize:asc', label: 'Smallest First' },
  ];

  const formatOptions = [
    { value: '', label: 'All Formats' },
    { value: 'jpg', label: 'JPEG' },
    { value: 'png', label: 'PNG' },
    { value: 'gif', label: 'GIF' },
    { value: 'webp', label: 'WebP' },
    { value: 'svg', label: 'SVG' },
    { value: 'mp4', label: 'MP4' },
    { value: 'pdf', label: 'PDF' },
  ];

  const folderOptions = [
    { value: '', label: 'All Folders' },
    ...folders.map((f) => ({ value: f.name, label: `${f.name} (${f.count})` })),
  ];

  const isTrashView = activeTab === 'trash';
  const isUnusedView = activeTab === 'unused';

  return (
    <DashboardLayout
      title="Media Library - CMS Management"
      description="Manage your digital assets"
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
        onChange={handleUpload}
        className="hidden"
      />

      {uploading && uploadStep && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl p-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: accentColor + '15' }}>
                {uploadStep === 'completed' ? (
                  <CheckCircle size={32} style={{ color: accentColor }} />
                ) : (
                  <Loader2 size={32} className="animate-spin" style={{ color: accentColor }} />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
                {UPLOAD_STEPS.find((s) => s.key === uploadStep)?.label || 'Processing...'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                File {uploadProgress.current} of {uploadProgress.total}
              </p>
              <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ backgroundColor: accentColor, width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                />
              </div>
              <div className="mt-6 space-y-2">
                {UPLOAD_STEPS.map((step, idx) => {
                  const currentIdx = UPLOAD_STEPS.findIndex((s) => s.key === uploadStep);
                  const StepIcon = step.icon;
                  const isDone = idx < currentIdx;
                  const isCurrent = idx === currentIdx;
                  return (
                    <div key={step.key} className={`flex items-center gap-3 text-sm ${isCurrent ? 'text-gray-800 dark:text-white font-medium' : isDone ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                      {isDone ? <CheckCircle size={16} /> : isCurrent ? <Loader2 size={16} className="animate-spin" /> : <StepIcon size={16} />}
                      <span>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">Media Library</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Manage and organize your digital assets</p>
        </div>
        {!isTrashView && !isUnusedView && (
          <Button
            variant="primary"
            icon={Upload}
            loading={uploading}
            onClick={() => fileInputRef.current?.click()}
            style={{ backgroundColor: accentColor }}
          >
            Upload Files
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-sm transition-shadow">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Total Files</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            <div className="w-10 h-10 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <LayoutGrid className="text-gray-400 dark:text-gray-500" size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-sm transition-shadow">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">In Trash</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.trashCount}</p>
            <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
              <Trash2 className="text-orange-500 dark:text-orange-400" size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-sm transition-shadow">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Total Storage</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatFileSize(stats.totalSize)}</p>
            <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <HardDrive className="text-green-500 dark:text-green-400" size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-sm transition-shadow">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Avg. File Size</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatFileSize(stats.averageFileSize)}</p>
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <BarChart3 className="text-blue-500 dark:text-blue-400" size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { id: 'library', label: 'All Files', icon: Layers, count: stats.total },
          { id: 'trash', label: 'Trash', icon: Trash2, count: stats.trashCount },
          { id: 'unused', label: 'Unused', icon: AlertTriangle, count: null },
        ].map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedIds([]); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
              style={activeTab === tab.id ? { backgroundColor: accentColor } : {}}
            >
              <TabIcon size={16} />
              {tab.label}
              {tab.count !== null && (
                <span className={`px-1.5 py-0.5 text-xs rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {!isUnusedView && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex-1 relative min-w-0">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={isTrashView ? 'Search trashed files...' : 'Search by name, alt text, caption, folder...'}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2"
                />
              </div>
              {!isTrashView && (
                <>
                  <Select options={formatOptions} value={formatFilter} onChange={(e) => setFormatFilter(e.target.value)} className="min-w-[130px]" />
                  <Select options={folderOptions} value={folderFilter} onChange={(e) => setFolderFilter(e.target.value)} className="min-w-[130px]" />
                </>
              )}
              <Select options={sortOptions} value={`${sort}:${order}`} onChange={(e) => { const [s, o] = e.target.value.split(':'); setSort(s); setOrder(o); }} className="min-w-[140px]" />
            </div>
            <div className="flex justify-end">
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 gap-1">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`} title="Grid view">
                  <LayoutGrid size={18} />
                </button>
                <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 shadow text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`} title="Table view">
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isUnusedView && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Unused images are not referenced by any project or blog.
            </span>
          </div>
          {media.length > 0 && (
            <Button variant="danger" size="sm" icon={Trash2} onClick={() => setDeleteAllUnusedConfirm(true)}>
              Delete All Unused
            </Button>
          )}
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 mb-6 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {selectedIds.length} file{selectedIds.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2 flex-wrap">
            {isTrashView ? (
              <>
                <Button variant="secondary" size="sm" icon={RotateCcw} onClick={handleBulkRestore}>Restore</Button>
                <Button variant="danger" size="sm" icon={Trash2} onClick={() => setBulkPermanentConfirm(true)}>Permanent Delete</Button>
              </>
            ) : (
              <>
                <Button variant="secondary" size="sm" icon={Move} onClick={() => setMoveConfirm(true)}>Move</Button>
                <Button variant="danger" size="sm" icon={Trash2} onClick={() => setBulkDeleteConfirm(true)}>Delete</Button>
              </>
            )}
          </div>
          <button onClick={() => setSelectedIds([])} className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
            <X size={18} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <X size={36} className="text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Something went wrong</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">{error}</p>
          <Button variant="secondary" onClick={() => fetchMedia()}>Try Again</Button>
        </div>
      ) : media.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            {isTrashView ? (
              <Trash2 size={36} className="text-gray-400 dark:text-gray-500" />
            ) : isUnusedView ? (
              <CheckCircle size={36} className="text-green-400 dark:text-green-500" />
            ) : (
              <FolderOpen size={36} className="text-gray-400 dark:text-gray-500" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            {isTrashView
              ? 'Trash is empty'
              : isUnusedView
                ? 'No unused files'
                : debouncedSearch || formatFilter || folderFilter ? 'No files found' : 'No media yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
            {isTrashView
              ? 'Deleted files will appear here for 30 days before being permanently removed.'
              : isUnusedView
                ? 'All uploaded images are currently in use.'
                : debouncedSearch || formatFilter || folderFilter
                  ? 'Try adjusting your search or filters.'
                  : 'Upload your first file to get started.'}
          </p>
          {!isTrashView && !isUnusedView && !debouncedSearch && !formatFilter && !folderFilter && (
            <Button variant="primary" icon={Upload} onClick={() => fileInputRef.current?.click()} style={{ backgroundColor: accentColor }}>
              Upload Files
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {media.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const FormatIcon = getFormatIcon(item.format);
            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-gray-800 rounded-xl border overflow-hidden hover:shadow-md transition-shadow group relative cursor-pointer ${
                  isSelected ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/30' : 'border-gray-100 dark:border-gray-700'
                }`}
                onClick={() => { setDetailItem(item); }}
              >
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                  {IMAGE_FORMATS.includes(item.format) ? (
                    <img src={item.url} alt={item.altText || item.fileName} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FormatIcon size={40} className="text-gray-300 dark:text-gray-600" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => { e.stopPropagation(); handleToggleSelect(item.id); }}
                      className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent cursor-pointer"
                    />
                  </div>
                  {item.originalFormat && item.originalFormat !== item.format && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="success" size="sm">{item.originalFormat.toUpperCase()}→{item.format.toUpperCase()}</Badge>
                    </div>
                  )}
                  {!isTrashView && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1" style={item.originalFormat ? { top: '2.5rem' } : {}}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopyUrl(item.secureUrl || item.url); }}
                        className="w-7 h-7 bg-black/50 hover:bg-black/70 rounded-md flex items-center justify-center text-white transition-colors"
                        title="Copy URL"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-white text-xs font-medium truncate">{item.fileName}</p>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{formatFileSize(item.fileSize)} &middot; {item.format?.toUpperCase()}</p>
                  {item.width && item.height && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">{item.width}×{item.height}</p>
                  )}
                  {isTrashView && item.deletedAt && (
                    <p className="text-xs text-orange-500 dark:text-orange-400 mt-1">Deleted {formatDateShort(item.deletedAt)}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="text-left px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === media.length && media.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent cursor-pointer"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Preview</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Format</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Size</th>
                  {!isTrashView && <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Folder</th>}
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{isTrashView ? 'Deleted' : 'Uploaded'}</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {media.map((item) => {
                  const FormatIcon = getFormatIcon(item.format);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer" onClick={() => setDetailItem(item)}>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => handleToggleSelect(item.id)}
                          className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          {IMAGE_FORMATS.includes(item.format) ? (
                            <img src={item.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <FormatIcon size={18} className="text-gray-400" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-800 dark:text-white truncate max-w-[200px]">{item.fileName}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="default" size="sm">{item.format?.toUpperCase()}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(item.fileSize)}</span>
                      </td>
                      {!isTrashView && (
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-500 dark:text-gray-400">{item.folder}</span>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {isTrashView ? formatDateShort(item.deletedAt) : formatDateShort(item.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {!isTrashView ? (
                            <>
                              <button onClick={() => handleCopyUrl(item.secureUrl || item.url)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors" title="Copy URL">
                                <Copy size={14} className="text-gray-400" />
                              </button>
                              <button onClick={() => { setEditingItem(item); setEditForm({ altText: item.altText || '', caption: item.caption || '', fileName: item.fileName, folder: item.folder }); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors" title="Edit">
                                <Edit2 size={14} className="text-gray-400" />
                              </button>
                              <button onClick={() => setDeleteConfirm({ open: true, item, permanent: false })} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors" title="Delete">
                                <Trash2 size={14} className="text-red-400" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => setRestoreConfirm({ open: true, item })} className="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors" title="Restore">
                                <RotateCcw size={14} className="text-green-500" />
                              </button>
                              <button onClick={() => setDeleteConfirm({ open: true, item, permanent: true })} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors" title="Permanent Delete">
                                <Trash2 size={14} className="text-red-500" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && media.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {((pagination.page - 1) * pagination.perPage) + 1}-{Math.min(pagination.page * pagination.perPage, pagination.total)} of {pagination.total} files
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={ChevronLeft} disabled={!pagination.hasPrev} onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}>Previous</Button>
            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) pageNum = i + 1;
              else if (pagination.page <= 3) pageNum = i + 1;
              else if (pagination.page >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
              else pageNum = pagination.page - 2 + i;
              return (
                <button key={pageNum} onClick={() => setPagination((prev) => ({ ...prev, page: pageNum }))} className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${pagination.page === pageNum ? 'text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'}`} style={pagination.page === pageNum ? { backgroundColor: accentColor } : {}}>
                  {pageNum}
                </button>
              );
            })}
            <Button variant="secondary" size="sm" icon={ChevronRight} iconPosition="right" disabled={!pagination.hasNext} onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}>Next</Button>
          </div>
        </div>
      )}

      {detailItem && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="fixed inset-0 bg-black/50" onClick={() => { setDetailItem(null); setEditingItem(null); }} />
          <div className="relative w-full sm:w-[420px] bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto z-10 animate-slideInRight">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">File Details</h3>
              <button onClick={() => { setDetailItem(null); setEditingItem(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                {['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'].includes(detailItem.format) ? (
                  <img src={detailItem.url} alt={detailItem.altText || detailItem.fileName} className="w-full object-contain max-h-[300px]" />
                ) : (
                  <div className="h-48 flex items-center justify-center">
                    {(() => { const Icon = getFormatIcon(detailItem.format); return <Icon size={48} className="text-gray-400" />; })()}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" size="sm" icon={Copy} onClick={() => handleCopyUrl(detailItem.secureUrl || detailItem.url)} className="flex-1">Copy URL</Button>
                <Button variant="secondary" size="sm" icon={Copy} onClick={() => handleCopyPublicId(detailItem.publicId)} className="flex-1">Copy Public ID</Button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Original Filename</p>
                  <p className="text-sm text-gray-800 dark:text-white">{detailItem.originalName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Current Filename</p>
                  <p className="text-sm text-gray-800 dark:text-white">{detailItem.fileName}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Format</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" size="sm">{detailItem.format?.toUpperCase()}</Badge>
                      {detailItem.originalFormat && detailItem.originalFormat !== detailItem.format && (
                        <Badge variant="info" size="sm">from {detailItem.originalFormat.toUpperCase()}</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">File Size</p>
                    <p className="text-sm text-gray-800 dark:text-white">{formatFileSize(detailItem.fileSize)}</p>
                    {detailItem.originalFileSize && detailItem.originalFileSize !== detailItem.fileSize && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Saved {formatFileSize(detailItem.originalFileSize - detailItem.fileSize)} ({Math.round(((detailItem.originalFileSize - detailItem.fileSize) / detailItem.originalFileSize) * 100)}%)
                      </p>
                    )}
                  </div>
                </div>
                {detailItem.width && detailItem.height && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Dimensions</p>
                    <p className="text-sm text-gray-800 dark:text-white">{detailItem.width} × {detailItem.height}px</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Folder</p>
                  <p className="text-sm text-gray-800 dark:text-white">{detailItem.folder}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Cloudinary Public ID</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 font-mono break-all">{detailItem.publicId}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Uploaded</p>
                  <p className="text-sm text-gray-800 dark:text-white">{formatDateShort(detailItem.createdAt)}</p>
                  {detailItem.uploadedBy && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">by {detailItem.uploadedBy.name}</p>
                  )}
                </div>
              </div>

              {editingItem?.id === detailItem.id ? (
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Edit Metadata</h4>
                  <Input label="Alt Text" value={editForm.altText} onChange={(e) => setEditForm((p) => ({ ...p, altText: e.target.value }))} placeholder="Describe this image" />
                  <Textarea label="Caption" value={editForm.caption} onChange={(e) => setEditForm((p) => ({ ...p, caption: e.target.value }))} placeholder="Optional caption" rows={2} />
                  <Input label="File Name" value={editForm.fileName} onChange={(e) => setEditForm((p) => ({ ...p, fileName: e.target.value }))} />
                  <Input label="Folder" value={editForm.folder} onChange={(e) => setEditForm((p) => ({ ...p, folder: e.target.value }))} />
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" onClick={handleUpdateMeta} style={{ backgroundColor: accentColor }}>Save</Button>
                    <Button variant="secondary" size="sm" onClick={() => setEditingItem(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Alt Text</p>
                    <p className="text-sm text-gray-800 dark:text-white">{detailItem.altText || <span className="italic text-gray-400">Not set</span>}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Caption</p>
                    <p className="text-sm text-gray-800 dark:text-white">{detailItem.caption || <span className="italic text-gray-400">Not set</span>}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                {isTrashView ? (
                  <>
                    <Button variant="primary" size="sm" icon={RotateCcw} onClick={() => setRestoreConfirm({ open: true, item: detailItem })} className="flex-1" style={{ backgroundColor: accentColor }}>
                      Restore
                    </Button>
                    <Button variant="danger" size="sm" icon={Trash2} onClick={() => setDeleteConfirm({ open: true, item: detailItem, permanent: true })} className="flex-1">
                      Permanent Delete
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="secondary" size="sm" icon={Edit2} onClick={() => { setEditingItem(detailItem); setEditForm({ altText: detailItem.altText || '', caption: detailItem.caption || '', fileName: detailItem.fileName, folder: detailItem.folder }); }} className="flex-1">
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" icon={Trash2} onClick={() => setDeleteConfirm({ open: true, item: detailItem, permanent: false })} className="flex-1">
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, item: null, permanent: false })}
        onConfirm={() => handleDelete(deleteConfirm.item, deleteConfirm.permanent)}
        title={deleteConfirm.permanent ? 'Permanently Delete File' : 'Delete File'}
        message={deleteConfirm.permanent
          ? `This action will permanently delete "${deleteConfirm.item?.fileName || ''}" from both the CMS and Cloudinary. This action cannot be undone.`
          : `Are you sure you want to delete "${deleteConfirm.item?.fileName || ''}"? It will be moved to trash and permanently deleted after 30 days.`}
        confirmText={deleteConfirm.permanent ? 'Permanently Delete' : 'Move to Trash'}
        cancelText="Cancel"
        type="danger"
      />

      <ConfirmDialog
        isOpen={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Delete Files"
        message={`Are you sure you want to delete ${selectedIds.length} file${selectedIds.length !== 1 ? 's' : ''}? They will be moved to trash.`}
        confirmText="Move to Trash"
        cancelText="Cancel"
        type="danger"
      />

      <ConfirmDialog
        isOpen={bulkPermanentConfirm}
        onClose={() => setBulkPermanentConfirm(false)}
        onConfirm={handleBulkPermanentDelete}
        title="Permanently Delete Files"
        message={`This action will permanently delete ${selectedIds.length} file${selectedIds.length !== 1 ? 's' : ''} from both the CMS and Cloudinary. This action cannot be undone.`}
        confirmText="Permanently Delete"
        cancelText="Cancel"
        type="danger"
      />

      <ConfirmDialog
        isOpen={restoreConfirm.open}
        onClose={() => setRestoreConfirm({ open: false, item: null })}
        onConfirm={() => handleRestore(restoreConfirm.item)}
        title="Restore File"
        message={`Are you sure you want to restore "${restoreConfirm.item?.fileName || ''}"? It will be moved back to the Media Library.`}
        confirmText="Restore"
        cancelText="Cancel"
        type="default"
      />

      <ConfirmDialog
        isOpen={deleteAllUnusedConfirm}
        onClose={() => setDeleteAllUnusedConfirm(false)}
        onConfirm={handleDeleteAllUnused}
        title="Delete All Unused Files"
        message="This will move all unused images to Trash. They will be permanently deleted after 30 days. This action can be reversed by restoring from Trash."
        confirmText="Move All Unused to Trash"
        cancelText="Cancel"
        type="danger"
      />

      {moveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => { setMoveConfirm(false); setMoveFolder(''); }} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">Move Files</h2>
              <button onClick={() => { setMoveConfirm(false); setMoveFolder(''); }} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <Input label="Folder Name" value={moveFolder} onChange={(e) => setMoveFolder(e.target.value)} placeholder="e.g., projects, blogs, banners" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Moving {selectedIds.length} file{selectedIds.length !== 1 ? 's' : ''} to this folder.
              </p>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-100 dark:border-gray-700">
              <Button variant="primary" onClick={handleBulkMove} disabled={!moveFolder.trim()} style={{ backgroundColor: accentColor }}>Move</Button>
              <Button variant="secondary" onClick={() => { setMoveConfirm(false); setMoveFolder(''); }}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

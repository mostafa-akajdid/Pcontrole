import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
  LayoutGrid,
  List,
  Trash2,
  Eye,
  Edit2,
  Star,
  StarOff,
  Globe,
  FileText,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  FolderPlus,
  X,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import DataTable from '@/components/ui/DataTable';
import ActionMenu from '@/components/ui/ActionMenu';
import SearchBar from '@/components/ui/SearchBar';
import FilterTabs from '@/components/ui/FilterTabs';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import BlogFormModal from '@/components/modals/BlogFormModal';
import BlogDetailModal from '@/components/modals/BlogDetailModal';
import { useAppearance } from '@/contexts/AppearanceContext';
import { useToast } from '@/contexts/ToastContext';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function Blogs() {
  const { accentColor } = useAppearance();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('blogs');
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, perPage: 12, total: 0, totalPages: 1, hasNext: false, hasPrev: false });
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, featured: 0, trashed: 0 });

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid');

  const [selectedIds, setSelectedIds] = useState([]);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, blog: null });
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [permanentDeleteConfirm, setPermanentDeleteConfirm] = useState({ open: false, blog: null });
  const [bulkPermanentDeleteConfirm, setBulkPermanentDeleteConfirm] = useState(false);

  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryDeleteConfirm, setCategoryDeleteConfirm] = useState({ open: false, category: null });

  const abortRef = useRef(null);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  const statusTabs = [
    { value: 'all', label: 'All' },
    { value: 'PUBLISHED', label: 'Published' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'TRASH', label: 'Trash' },
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Date Created' },
    { value: 'updatedAt', label: 'Date Updated' },
    { value: 'title', label: 'Title' },
  ];

  const fetchBlogs = useCallback(async (overrides = {}) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const page = overrides.page ?? pagination.page;
      const isTrash = statusFilter === 'TRASH';
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('perPage', String(pagination.perPage));
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (!isTrash && statusFilter !== 'all') params.set('status', statusFilter);
      if (!isTrash && featuredFilter !== null) params.set('featured', String(featuredFilter));
      if (!isTrash && categoryFilter) params.set('categoryId', categoryFilter);
      params.set('sort', sort);
      params.set('order', order);

      const endpoint = isTrash ? '/api/blogs/trash' : '/api/blogs';
      const res = await fetch(`${endpoint}?${params.toString()}`, { signal: controller.signal });
      const json = await res.json();
      if (json.success) {
        setBlogs(json.data.items || []);
        setPagination(json.data.pagination || { page: 1, perPage: 12, total: 0, totalPages: 1, hasNext: false, hasPrev: false });
      } else {
        setError(json.message || 'Failed to load blogs');
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.perPage, debouncedSearch, statusFilter, featuredFilter, categoryFilter, sort, order]);

  const fetchStatsDetail = useCallback(async () => {
    try {
      const res = await fetch('/api/blogs/stats');
      const json = await res.json();
      if (json.success) {
        setStats({
          total: json.data.total || 0,
          published: json.data.published || 0,
          draft: json.data.draft || 0,
          featured: json.data.featured || 0,
          trashed: json.data.trashed || 0,
        });
      }
    } catch (e) {
      console.warn('Failed to load blog stats:', e);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const res = await fetch('/api/blog-categories');
      const json = await res.json();
      if (json.success) {
        setCategories(Array.isArray(json.data) ? json.data : json.data.items || []);
      } else {
        toast.error(json.message || 'Failed to load categories');
      }
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchStatsDetail();
  }, []);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearch, statusFilter, featuredFilter, categoryFilter, sort, order]);

  useEffect(() => {
    if (activeTab === 'blogs') {
      fetchBlogs();
    }
  }, [fetchBlogs, activeTab]);

  useEffect(() => {
    if (activeTab === 'categories') {
      fetchCategories();
    }
  }, [activeTab, fetchCategories]);

  const handleFormSubmit = async (formData) => {
    const method = editingBlog ? 'PUT' : 'POST';
    const url = editingBlog ? `/api/blogs/${editingBlog.id}` : '/api/blogs';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || 'Operation failed');
    }
    toast.success(editingBlog ? 'Blog updated' : 'Blog created');
    setShowFormModal(false);
    setEditingBlog(null);
    fetchBlogs();
    fetchStatsDetail();
  };

  const handleDeleteBlog = async (blog) => {
    try {
      const res = await fetch(`/api/blogs/${blog.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Blog deleted');
        setDeleteConfirm({ open: false, blog: null });
        fetchBlogs();
        fetchStatsDetail();
      } else {
        toast.error(json.message || 'Failed to delete');
      }
    } catch {
      toast.error('Failed to delete blog');
    }
  };

  const handlePermanentDeleteBlog = async (blog) => {
    try {
      const res = await fetch('/api/blogs/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [blog.id], action: 'permanentDelete' }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Blog permanently deleted');
        setPermanentDeleteConfirm({ open: false, blog: null });
        fetchBlogs();
        fetchStatsDetail();
      } else {
        toast.error(json.message || 'Failed to permanently delete');
      }
    } catch {
      toast.error('Failed to permanently delete blog');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch('/api/blogs/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, action }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Bulk ${action} completed`);
        setSelectedIds([]);
        if (action === 'permanentDelete') {
          setBulkPermanentDeleteConfirm(false);
        } else {
          setBulkDeleteConfirm(false);
        }
        fetchBlogs();
        fetchStatsDetail();
      } else {
        toast.error(json.message || `Bulk ${action} failed`);
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (selectedIds.length === blogs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(blogs.map((b) => b.id));
    }
  };

  const handleCategorySubmit = async () => {
    if (!categoryForm.name.trim()) {
      toast.warning('Category name is required');
      return;
    }
    setCategorySaving(true);
    try {
      const method = editingCategory ? 'PUT' : 'POST';
      const url = editingCategory ? `/api/blog-categories/${editingCategory.id}` : '/api/blog-categories';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(editingCategory ? 'Category updated' : 'Category created');
        setShowCategoryModal(false);
        setEditingCategory(null);
        setCategoryForm({ name: '', description: '' });
        fetchCategories();
      } else {
        toast.error(json.message || 'Operation failed');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setCategorySaving(false);
    }
  };

  const handleDeleteCategory = async (category) => {
    try {
      const res = await fetch(`/api/blog-categories/${category.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Category deleted');
        setCategoryDeleteConfirm({ open: false, category: null });
        fetchCategories();
      } else {
        toast.error(json.message || 'Failed to delete');
      }
    } catch {
      toast.error('Failed to delete category');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredCategories = categories.filter((c) =>
    c.name?.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const getCategoryName = (cat) => {
    if (typeof cat === 'string') return cat;
    if (cat?.name) return cat.name;
    return '';
  };

  const blogActions = (blog) => {
    if (blog.deletedAt) {
      return [
        {
          label: 'Restore',
          icon: RotateCcw,
          onClick: () => handleBulkActionSingle(blog.id, 'restore'),
        },
        { label: '', divider: true },
        {
          label: 'Delete Permanently',
          icon: Trash2,
          danger: true,
          onClick: () => setPermanentDeleteConfirm({ open: true, blog }),
        },
      ];
    }
    return [
      {
        label: 'View',
        icon: Eye,
        onClick: () => { setSelectedBlog(blog); setShowDetail(true); },
      },
      {
        label: 'Edit',
        icon: Edit2,
        onClick: () => { setEditingBlog(blog); setShowFormModal(true); },
      },
      { label: '', divider: true },
      {
        label: blog.status === 'PUBLISHED' ? 'Unpublish' : 'Publish',
        icon: blog.status === 'PUBLISHED' ? FileText : Globe,
        onClick: () => handleBulkActionSingle(blog.id, blog.status === 'PUBLISHED' ? 'unpublish' : 'publish'),
      },
      {
        label: blog.featured ? 'Unfeature' : 'Feature',
        icon: blog.featured ? StarOff : Star,
        onClick: () => handleBulkActionSingle(blog.id, blog.featured ? 'unfeature' : 'feature'),
      },
      { label: '', divider: true },
      {
        label: 'Delete',
        icon: Trash2,
        danger: true,
        onClick: () => setDeleteConfirm({ open: true, blog }),
      },
    ];
  };

  const handleBulkActionSingle = async (id, action) => {
    try {
      const res = await fetch('/api/blogs/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id], action }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Action completed');
        fetchBlogs();
        fetchStatsDetail();
      } else {
        toast.error(json.message || 'Action failed');
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  const blogTableColumns = [
    {
      header: '',
      accessor: 'checkbox',
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={(e) => { e.stopPropagation(); handleToggleSelect(row.id); }}
          className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent cursor-pointer"
        />
      ),
    },
    {
      header: 'Cover',
      accessor: 'coverImage',
      render: (row) => (
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
          {row.coverImage ? (
            <img src={row.coverImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon size={18} className="text-gray-400" />
          )}
        </div>
      ),
    },
    {
      header: 'Title',
      accessor: 'title',
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-800 dark:text-white text-sm">{row.title}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{row.excerpt || ''}</p>
        </div>
      ),
    },
    {
      header: 'Categories',
      accessor: 'categories',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {(row.categories || []).slice(0, 2).map((cat, i) => (
            <Badge key={i} variant="primary" size="sm">{getCategoryName(cat)}</Badge>
          ))}
          {(row.categories || []).length > 2 && (
            <Badge variant="default" size="sm">+{row.categories.length - 2}</Badge>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <Badge variant={row.status === 'PUBLISHED' ? 'success' : 'warning'} size="sm">
          {row.status === 'PUBLISHED' ? 'Published' : 'Draft'}
        </Badge>
      ),
    },
    {
      header: 'Updated',
      accessor: 'updatedAt',
      render: (row) => <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(row.updatedAt)}</span>,
    },
    {
      header: '',
      accessor: 'actions',
      render: (row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <ActionMenu actions={blogActions(row)} />
        </div>
      ),
    },
  ];

  const loadingSkeleton = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse">
          <div className="h-40 bg-gray-200 dark:bg-gray-700" />
          <div className="p-5 space-y-3">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            <div className="flex gap-2 pt-2">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const errorState = (
    <div className="text-center py-16">
      <div className="w-20 h-20 mx-auto mb-6 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center">
        <X size={36} className="text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Something went wrong</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">{error}</p>
      <Button variant="secondary" onClick={() => fetchBlogs()}>Try Again</Button>
    </div>
  );

  const emptyState = (
    <div className="text-center py-16">
      <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
        <FolderOpen size={36} className="text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
        {statusFilter === 'TRASH' ? 'Trash is empty' : 'No blogs found'}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
        {statusFilter === 'TRASH'
          ? 'No deleted blogs. Deleted blogs will appear here.'
          : debouncedSearch || statusFilter !== 'all' || categoryFilter
            ? 'No blogs match your current filters. Try adjusting your search criteria.'
            : 'Get started by creating your first blog post.'}
      </p>
      {statusFilter !== 'TRASH' && !debouncedSearch && statusFilter === 'all' && !categoryFilter && (
        <Button variant="primary" icon={Plus} onClick={() => { setEditingBlog(null); setShowFormModal(true); }}>
          Create your first blog
        </Button>
      )}
    </div>
  );

  return (
    <DashboardLayout
      title="Blogs - CMS Management"
      description="Manage and publish your blog content"
    >
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex gap-1 mb-6 max-w-xs">
        <button
          onClick={() => setActiveTab('blogs')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'blogs'
              ? 'bg-white dark:bg-gray-700 shadow text-gray-800 dark:text-white'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Blogs
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'categories'
              ? 'bg-white dark:bg-gray-700 shadow text-gray-800 dark:text-white'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Categories
        </button>
      </div>

      {activeTab === 'blogs' && (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">
                {statusFilter === 'TRASH' ? 'Trash' : 'Blogs'}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {statusFilter === 'TRASH' ? 'Manage deleted blogs' : 'Manage and publish your blog content'}
              </p>
            </div>
            {statusFilter !== 'TRASH' && (
              <Button variant="primary" icon={Plus} onClick={() => { setEditingBlog(null); setShowFormModal(true); }} style={{ backgroundColor: accentColor }}>
                New Blog
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => { setStatusFilter('all'); setFeaturedFilter(null); }}>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Total Blogs</p>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                <div className="w-10 h-10 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <LayoutGrid className="text-gray-400 dark:text-gray-500" size={20} />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setStatusFilter('PUBLISHED')}>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Published</p>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.published}</p>
                <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <Globe className="text-green-500 dark:text-green-400" size={20} />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setStatusFilter('DRAFT')}>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Draft</p>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.draft}</p>
                <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                  <FileText className="text-orange-500 dark:text-orange-400" size={20} />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => { setStatusFilter('all'); setFeaturedFilter(featuredFilter === true ? null : true); }}>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Featured</p>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.featured}</p>
                <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                  <Star className="text-yellow-500 dark:text-yellow-400" size={20} />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setStatusFilter('TRASH')}>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Trash</p>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.trashed}</p>
                <div className="w-10 h-10 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <Trash2 className="text-red-500 dark:text-red-400" size={20} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 mb-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <SearchBar value={search} onChange={setSearch} placeholder={statusFilter === 'TRASH' ? 'Search trash...' : 'Search blogs...'} className="flex-1 min-w-0" />
                <FilterTabs tabs={statusTabs} activeTab={statusFilter} onChange={setStatusFilter} />
                {statusFilter !== 'TRASH' && (
                  <div className="flex gap-2 items-center">
                    <Select
                      options={[{ value: '', label: 'All Categories' }, ...categories.map((c) => ({ value: String(c.id), label: c.name }))]}
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="min-w-[140px]"
                    />
                    <Select
                      options={sortOptions}
                      value={`${sort}:${order}`}
                      onChange={(e) => { const [s, o] = e.target.value.split(':'); setSort(s); setOrder(o); }}
                      className="min-w-[140px]"
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 gap-1">
                  <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`} title="Grid view">
                    <LayoutGrid size={18} />
                  </button>
                  <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 shadow text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`} title="Table view">
                    <List size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 mb-6 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {selectedIds.length} blog{selectedIds.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2 flex-wrap">
                {statusFilter === 'TRASH' ? (
                  <>
                    <Button variant="primary" size="sm" icon={RotateCcw} onClick={() => handleBulkAction('restore')} style={{ backgroundColor: accentColor }}>
                      Restore
                    </Button>
                    <Button variant="danger" size="sm" icon={Trash2} onClick={() => setBulkPermanentDeleteConfirm(true)}>
                      Delete Permanently
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="primary" size="sm" icon={Globe} onClick={() => handleBulkAction('publish')} style={{ backgroundColor: accentColor }}>Publish</Button>
                    <Button variant="secondary" size="sm" icon={FileText} onClick={() => handleBulkAction('unpublish')}>Unpublish</Button>
                    <Button variant="secondary" size="sm" icon={Star} onClick={() => handleBulkAction('feature')}>Feature</Button>
                    <Button variant="secondary" size="sm" icon={StarOff} onClick={() => handleBulkAction('unfeature')}>Unfeature</Button>
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
            loadingSkeleton
          ) : error ? (
            errorState
          ) : blogs.length === 0 ? (
            emptyState
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog) => (
                <div key={blog.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow group relative">
                  <div className="h-44 relative">
                    <div className="absolute inset-0 rounded-t-xl overflow-hidden">
                      {blog.coverImage ? (
                        <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                          <ImageIcon size={40} className="text-gray-300 dark:text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="absolute top-3 left-3 z-10">
                      <input type="checkbox" checked={selectedIds.includes(blog.id)} onChange={() => handleToggleSelect(blog.id)} className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent cursor-pointer" />
                    </div>
                    {blog.featured && (
                      <div className="absolute top-3 right-12 z-10">
                        <div className="w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center shadow">
                          <Star size={14} className="text-white fill-white" />
                        </div>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 z-10">
                      <Badge variant={blog.status === 'PUBLISHED' ? 'success' : 'warning'} size="sm">
                        {blog.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                    <div className="absolute bottom-3 right-3 z-[100] opacity-0 group-hover:opacity-100 transition-opacity">
                      <ActionMenu actions={blogActions(blog)} />
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-1 line-clamp-1">{blog.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{blog.excerpt || ''}</p>
                    {(blog.categories || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {blog.categories.slice(0, 3).map((cat, i) => (
                          <Badge key={i} variant="primary" size="sm">{getCategoryName(cat)}</Badge>
                        ))}
                        {blog.categories.length > 3 && (
                          <Badge variant="default" size="sm">+{blog.categories.length - 3}</Badge>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {blog.author?.name || 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(blog.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <DataTable columns={blogTableColumns} data={blogs} />
          )}

          {!loading && !error && blogs.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {((pagination.page - 1) * pagination.perPage) + 1}-{Math.min(pagination.page * pagination.perPage, pagination.total)} of {pagination.total} blogs
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
        </>
      )}

      {activeTab === 'categories' && (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">Blog Categories</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Organize your blog posts into categories</p>
            </div>
            <Button variant="primary" icon={FolderPlus} onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', description: '' }); setShowCategoryModal(true); }} style={{ backgroundColor: accentColor }}>
              Add Category
            </Button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 mb-6">
            <SearchBar value={categorySearch} onChange={setCategorySearch} placeholder="Search categories..." />
          </div>

          {categoriesLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-8">
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/6" />
                  </div>
                ))}
              </div>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <FolderOpen size={36} className="text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                {categorySearch ? 'No categories found' : 'No categories yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                {categorySearch ? 'Try a different search term.' : 'Create your first category to organize blog posts.'}
              </p>
              {!categorySearch && (
                <Button variant="primary" icon={FolderPlus} onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', description: '' }); setShowCategoryModal(true); }}>
                  Add Category
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Name</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Slug</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Description</th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredCategories.map((category) => (
                      <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-800 dark:text-white text-sm">{category.name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{category.slug || '-'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[300px] block">{category.description || '-'}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <ActionMenu
                            actions={[
                              { label: 'Edit', icon: Edit2, onClick: () => { setEditingCategory(category); setCategoryForm({ name: category.name || '', description: category.description || '' }); setShowCategoryModal(true); } },
                              { label: '', divider: true },
                              { label: 'Delete', icon: Trash2, danger: true, onClick: () => setCategoryDeleteConfirm({ open: true, category }) },
                            ]}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <BlogFormModal
        isOpen={showFormModal}
        onClose={() => { setShowFormModal(false); setEditingBlog(null); }}
        onSubmit={handleFormSubmit}
        blog={editingBlog}
        categories={categories}
      />

      <BlogDetailModal
        isOpen={showDetail}
        onClose={() => { setShowDetail(false); setSelectedBlog(null); }}
        blog={selectedBlog}
      />

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, blog: null })}
        onConfirm={() => handleDeleteBlog(deleteConfirm.blog)}
        title="Delete Blog"
        message={`Are you sure you want to delete "${deleteConfirm.blog?.title || ''}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      <ConfirmDialog
        isOpen={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        onConfirm={() => handleBulkAction('delete')}
        title="Delete Blogs"
        message={`Are you sure you want to delete ${selectedIds.length} blog${selectedIds.length !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText="Delete All"
        cancelText="Cancel"
        type="danger"
      />

      <ConfirmDialog
        isOpen={permanentDeleteConfirm.open}
        onClose={() => setPermanentDeleteConfirm({ open: false, blog: null })}
        onConfirm={() => handlePermanentDeleteBlog(permanentDeleteConfirm.blog)}
        title="Permanently Delete Blog"
        message={`Are you sure you want to permanently delete "${permanentDeleteConfirm.blog?.title || ''}"? This action cannot be undone and the blog cannot be restored.`}
        confirmText="Delete Permanently"
        cancelText="Cancel"
        type="danger"
      />

      <ConfirmDialog
        isOpen={bulkPermanentDeleteConfirm}
        onClose={() => setBulkPermanentDeleteConfirm(false)}
        onConfirm={() => handleBulkAction('permanentDelete')}
        title="Permanently Delete Blogs"
        message={`Are you sure you want to permanently delete ${selectedIds.length} blog${selectedIds.length !== 1 ? 's' : ''}? This action cannot be undone and blogs cannot be restored.`}
        confirmText="Delete Permanently"
        cancelText="Cancel"
        type="danger"
      />

      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => { setShowCategoryModal(false); setEditingCategory(null); }} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                {editingCategory ? 'Edit Category' : 'New Category'}
              </h2>
              <button onClick={() => { setShowCategoryModal(false); setEditingCategory(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <Input label="Category Name" required value={categoryForm.name} onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Enter category name" />
              <Textarea label="Description" rows={3} value={categoryForm.description} onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Optional description" />
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-100 dark:border-gray-700">
              <Button variant="primary" loading={categorySaving} onClick={handleCategorySubmit} className="flex-1" style={{ backgroundColor: accentColor }}>
                {editingCategory ? 'Save Changes' : 'Create Category'}
              </Button>
              <Button variant="secondary" onClick={() => { setShowCategoryModal(false); setEditingCategory(null); }} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={categoryDeleteConfirm.open}
        onClose={() => setCategoryDeleteConfirm({ open: false, category: null })}
        onConfirm={() => handleDeleteCategory(categoryDeleteConfirm.category)}
        title="Delete Category"
        message={`Are you sure you want to delete "${categoryDeleteConfirm.category?.name || ''}"? Blog posts in this category won't be deleted.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </DashboardLayout>
  );
}

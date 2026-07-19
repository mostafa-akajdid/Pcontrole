import { useState, useEffect, useCallback } from 'react';
import { X, Settings, FileText, Image, Search, Plus, Trash2, GripVertical, Info, Upload } from 'lucide-react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import MediaPicker from '@/components/modals/MediaPicker';
import { useAppearance } from '@/contexts/AppearanceContext';
import { slugify } from '@/lib/utils';

const TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'images', label: 'Images', icon: Image },
  { id: 'seo', label: 'SEO', icon: Search },
];

const EMPTY_IMAGE = { url: '', publicId: '', altText: '', caption: '' };

const defaultFormState = {
  title: '',
  slug: '',
  excerpt: '',
  categories: [],
  status: 'draft',
  featured: false,
  content: '',
  coverImage: '',
  gallery: [],
  metaTitle: '',
  metaDescription: '',
};

export default function BlogFormModal({
  isOpen,
  onClose,
  onSubmit,
  blog = null,
  categories = [],
}) {
  const { accentColor } = useAppearance();

  const [isClosing, setIsClosing] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);

  const [form, setForm] = useState({ ...defaultFormState });

  const isEditMode = !!blog;

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setActiveTab('general');
      setFormErrors({});
      setSlugManuallyEdited(false);
      document.body.style.overflow = 'hidden';

      if (blog) {
        setForm({
          title: blog.title || '',
          slug: blog.slug || '',
          excerpt: blog.excerpt || '',
          categories: Array.isArray(blog.categories)
            ? blog.categories.map((c) => (typeof c === 'string' ? c : c.id))
            : [],
          status: (blog.status || 'DRAFT').toLowerCase(),
          featured: blog.featured || false,
          content: blog.content || '',
          coverImage: blog.coverImage || '',
          gallery: Array.isArray(blog.images)
            ? blog.images.map((img) => ({
                url: img.url || '',
                publicId: img.publicId || '',
                altText: img.altText || '',
                caption: img.caption || '',
              }))
            : [],
          metaTitle: blog.metaTitle || '',
          metaDescription: blog.metaDescription || '',
        });
        if (blog.slug) setSlugManuallyEdited(true);
      } else {
        setForm({ ...defaultFormState });
      }
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, blog?.id]);

  const updateForm = useCallback((field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'title' && !slugManuallyEdited) {
        next.slug = slugify(value);
      }
      return next;
    });
  }, [slugManuallyEdited]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setForm({ ...defaultFormState });
      setActiveTab('general');
      setFormErrors({});
      setSlugManuallyEdited(false);
    }, 400);
  };

  const validate = () => {
    const errors = {};
    if (!form.title.trim()) {
      errors.title = 'Title is required';
    }
    if (form.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) {
      errors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      setActiveTab('general');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: form.title,
        slug: form.slug || undefined,
        excerpt: form.excerpt || undefined,
        content: form.content || undefined,
        coverImage: form.coverImage || undefined,
        featured: form.featured,
        status: form.status.toUpperCase(),
        metaTitle: form.metaTitle || undefined,
        metaDescription: form.metaDescription || undefined,
        categoryIds: form.categories.length > 0 ? form.categories : undefined,
        images: form.gallery.filter((img) => img.url).map((img, i) => ({
          url: img.url,
          publicId: img.publicId || `temp-${Date.now()}-${i}`,
          altText: img.altText || undefined,
          caption: img.caption || undefined,
          sortOrder: i,
        })),
      };
      await onSubmit(payload);
    } catch (err) {
      setFormErrors({ submit: err.message || 'Something went wrong' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addGalleryImage = () => {
    setForm((prev) => ({
      ...prev,
      gallery: [...prev.gallery, { ...EMPTY_IMAGE }],
    }));
  };

  const updateGalleryImage = (index, field, value) => {
    setForm((prev) => {
      const gallery = [...prev.gallery];
      gallery[index] = { ...gallery[index], [field]: value };
      return { ...prev, gallery };
    });
  };

  const removeGalleryImage = (index) => {
    setForm((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index),
    }));
  };

  const moveGalleryImage = (index, direction) => {
    setForm((prev) => {
      const gallery = [...prev.gallery];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= gallery.length) return prev;
      [gallery[index], gallery[targetIndex]] = [gallery[targetIndex], gallery[index]];
      return { ...prev, gallery };
    });
  };

  const handleCoverSelect = (media) => {
    if (media) {
      updateForm('coverImage', media.url || media.secureUrl);
    }
    setShowCoverPicker(false);
  };

  const handleGallerySelect = (selected) => {
    if (selected && selected.length > 0) {
      const newImages = selected.map((item) => ({
        url: item.url || item.secureUrl,
        publicId: item.publicId || item.id || '',
        altText: item.altText || '',
        caption: item.caption || '',
      }));
      setForm((prev) => ({
        ...prev,
        gallery: [...prev.gallery, ...newImages],
      }));
    }
    setShowGalleryPicker(false);
  };

  const toggleCategory = (categoryId) => {
    setForm((prev) => {
      const categories = prev.categories.includes(categoryId)
        ? prev.categories.filter((id) => id !== categoryId)
        : [...prev.categories, categoryId];
      return { ...prev, categories };
    });
  };

  if (!isOpen && !isClosing) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-[100] transition-opacity duration-300 ${
          isClosing ? 'animate-fadeOut' : 'animate-fadeIn'
        }`}
        onClick={handleClose}
      />

      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-[500px] lg:w-[600px] bg-white dark:bg-gray-900 shadow-2xl z-[101] transform transition-all duration-400 ease-out overflow-hidden ${
          isClosing ? 'animate-slideOutRight' : 'animate-slideInRight'
        }`}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {isEditMode ? 'Edit Blog' : 'Create New Blog'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isEditMode ? 'Update blog information' : 'Fill in the details to create a blog post'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex h-[calc(100vh-73px)]">
          <div className="w-32 lg:w-40 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0 overflow-y-auto py-4 px-2">
            <nav className="space-y-1">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 transition-all ${
                      isActive
                        ? 'text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                    style={isActive ? { backgroundColor: accentColor } : {}}
                  >
                    <tab.icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto"
          >
            <div className="p-6 space-y-6 min-h-full">
              {formErrors.submit && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-600 dark:text-red-400">{formErrors.submit}</p>
                </div>
              )}

              {activeTab === 'general' && (
                <div className="space-y-6">
                  <Input
                    label="Title"
                    type="text"
                    value={form.title}
                    onChange={(e) => updateForm('title', e.target.value)}
                    placeholder="Enter blog title"
                    required
                    error={formErrors.title}
                  />

                  <Input
                    label="Slug"
                    type="text"
                    value={form.slug}
                    onChange={(e) => {
                      setSlugManuallyEdited(true);
                      updateForm('slug', e.target.value);
                    }}
                    placeholder="blog-url-slug"
                    helperText="Auto-generated from title. Edit to customize."
                    error={formErrors.slug}
                  />

                  <Textarea
                    label="Excerpt"
                    value={form.excerpt}
                    onChange={(e) => updateForm('excerpt', e.target.value)}
                    placeholder="Brief summary of the blog post"
                    rows={3}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Categories
                    </label>
                    {categories.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => {
                          const isSelected = form.categories.includes(cat.id);
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => toggleCategory(cat.id)}
                              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                                isSelected
                                  ? 'text-white border-transparent shadow-sm'
                                  : 'text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                              }`}
                              style={isSelected ? { backgroundColor: accentColor } : {}}
                            >
                              {cat.name}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                        No categories available
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Status"
                      value={form.status}
                      onChange={(e) => updateForm('status', e.target.value)}
                      options={[
                        { value: 'draft', label: 'Draft' },
                        { value: 'published', label: 'Published' },
                      ]}
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Featured
                      </label>
                      <button
                        type="button"
                        onClick={() => updateForm('featured', !form.featured)}
                        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{
                          backgroundColor: form.featured ? accentColor : '#d1d5db',
                          focusRingColor: accentColor,
                        }}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            form.featured ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'content' && (
                <div className="space-y-6">
                  <div>
                    <Textarea
                      label="Content"
                      value={form.content}
                      onChange={(e) => updateForm('content', e.target.value)}
                      placeholder="Write your blog post content..."
                      rows={16}
                      className="min-h-[400px]"
                    />
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                      <Info size={14} />
                      <span>Rich text editor (TinyMCE) will be integrated in a future update.</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'images' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cover Image
                    </label>
                    {form.coverImage ? (
                      <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                        <img
                          src={form.coverImage}
                          alt="Cover preview"
                          className="w-full h-40 object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                          <button
                            type="button"
                            onClick={() => setShowCoverPicker(true)}
                            className="w-8 h-8 bg-white/90 hover:bg-white rounded-md flex items-center justify-center shadow-sm transition-colors"
                            title="Replace"
                          >
                            <Image size={14} className="text-gray-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateForm('coverImage', '')}
                            className="w-8 h-8 bg-white/90 hover:bg-white rounded-md flex items-center justify-center shadow-sm transition-colors"
                            title="Remove"
                          >
                            <Trash2 size={14} className="text-red-500" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowCoverPicker(true)}
                        className="w-full h-32 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                      >
                        <Upload size={20} />
                        <span className="text-sm font-medium">Choose Cover Image</span>
                      </button>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Gallery Images
                      </label>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {form.gallery.length} image{form.gallery.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {form.gallery.map((img, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 flex gap-3"
                        >
                          <div className="flex flex-col items-center gap-1 pt-1 flex-shrink-0">
                            <GripVertical size={16} className="text-gray-300 dark:text-gray-600" />
                            <button
                              type="button"
                              onClick={() => moveGalleryImage(index, -1)}
                              disabled={index === 0}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 10 6">
                                <path d="M5 0L10 6H0L5 0Z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => moveGalleryImage(index, 1)}
                              disabled={index === form.gallery.length - 1}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 10 6">
                                <path d="M5 6L0 0H10L5 6Z" />
                              </svg>
                            </button>
                          </div>

                          <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                            {img.url ? (
                              <img
                                src={img.url}
                                alt={img.altText || 'Gallery image'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = '';
                                  e.target.className = 'w-full h-full flex items-center justify-center text-gray-400';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Image size={20} className="text-gray-300 dark:text-gray-600" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 space-y-2 min-w-0">
                            <input
                              type="text"
                              value={img.url}
                              readOnly
                              placeholder="Selected from Media Library"
                              className="w-full px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none"
                            />
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={img.altText}
                                onChange={(e) => updateGalleryImage(index, 'altText', e.target.value)}
                                placeholder="Alt text"
                                className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-accent"
                              />
                              <input
                                type="text"
                                value={img.caption}
                                onChange={(e) => updateGalleryImage(index, 'caption', e.target.value)}
                                placeholder="Caption"
                                className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-accent"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeGalleryImage(index)}
                            className="self-start p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors flex-shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowGalleryPicker(true)}
                      className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                      <Plus size={16} />
                      Choose from Media Library
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'seo' && (
                <div className="space-y-6">
                  <div>
                    <Input
                      label="Meta Title"
                      type="text"
                      value={form.metaTitle}
                      onChange={(e) => {
                        if (e.target.value.length <= 200) {
                          updateForm('metaTitle', e.target.value);
                        }
                      }}
                      placeholder="SEO title for search engines"
                    />
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        Recommended: 50-60 characters
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          form.metaTitle.length > 180
                            ? 'text-red-500'
                            : form.metaTitle.length > 150
                            ? 'text-yellow-500'
                            : 'text-gray-400 dark:text-gray-500'
                        }`}
                      >
                        {form.metaTitle.length}/200
                      </span>
                    </div>
                  </div>

                  <div>
                    <Textarea
                      label="Meta Description"
                      value={form.metaDescription}
                      onChange={(e) => {
                        if (e.target.value.length <= 500) {
                          updateForm('metaDescription', e.target.value);
                        }
                      }}
                      placeholder="Brief description for search engine results"
                      rows={5}
                    />
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        Recommended: 150-160 characters
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          form.metaDescription.length > 450
                            ? 'text-red-500'
                            : form.metaDescription.length > 400
                            ? 'text-yellow-500'
                            : 'text-gray-400 dark:text-gray-500'
                        }`}
                      >
                        {form.metaDescription.length}/500
                      </span>
                    </div>
                  </div>

                  {(form.metaTitle || form.metaDescription || form.title) && (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                        Search Preview
                      </p>
                      <div className="space-y-1">
                        <p className="text-blue-600 dark:text-blue-400 text-base font-medium leading-snug truncate">
                          {form.metaTitle || form.title || 'Page Title'}
                        </p>
                        <p className="text-green-700 dark:text-green-500 text-xs truncate">
                          https://yoursite.com/blog/{form.slug || 'blog-slug'}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                          {form.metaDescription || form.excerpt || 'No description provided.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  rounded="lg"
                  loading={isSubmitting}
                >
                  {isEditMode ? 'Save Changes' : 'Create Blog'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  rounded="lg"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <MediaPicker
        isOpen={showCoverPicker}
        onClose={() => setShowCoverPicker(false)}
        onSelect={handleCoverSelect}
        multiple={false}
        title="Choose Cover Image"
      />
      <MediaPicker
        isOpen={showGalleryPicker}
        onClose={() => setShowGalleryPicker(false)}
        onSelect={handleGallerySelect}
        multiple={true}
        title="Choose Gallery Images"
      />
    </>
  );
}

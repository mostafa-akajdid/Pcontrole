import { useState, useEffect, useMemo } from 'react';
import { X, Calendar, User, Globe, Tag, FileText } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import { formatDateShort, getCategoryName } from '@/lib/utils';

function sanitizeForDisplay(html) {
  if (!html) return '';
  if (typeof window === 'undefined') return html;
  try {
    const DOMPurify = require('dompurify');
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'pre', 'blockquote',
        'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'strong', 'em', 'b', 'i', 'u', 's', 'code', 'div', 'span', 'section',
        'input', 'label',
      ],
      ALLOWED_ATTR: [
        'href', 'target', 'rel', 'title', 'alt', 'src', 'width', 'height',
        'class', 'style', 'colspan', 'rowspan', 'data-type', 'data-checked',
        'type', 'checked', 'disabled',
      ],
      ADD_ATTR: ['target'],
    });
  } catch {
    return html;
  }
}

export default function BlogDetailModal({ isOpen, onClose, blog }) {
  const { isClosing, handleClose, shouldRender } = useModalAnimation(isOpen, { delay: 400, onClose });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!shouldRender) return null;
  if (!blog) return null;

  const safeContent = useMemo(
    () => (blog.content ? sanitizeForDisplay(blog.content) : ''),
    [blog.content]
  );
  const isHtmlContent = safeContent && /<[a-z][\s\S]*>/i.test(safeContent);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-[100] transition-opacity duration-300 ${
          isClosing ? 'animate-fadeOut' : 'animate-fadeIn'
        }`}
        onClick={handleClose}
      ></div>

      <div className={`fixed inset-y-0 right-0 w-full sm:w-[600px] bg-white dark:bg-gray-900 shadow-2xl z-[101] transform transition-all duration-400 ease-out overflow-y-auto ${
        isClosing ? 'animate-slideOutRight' : 'animate-slideInRight'
      }`}>
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Blog Details</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">View blog post information</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {blog.coverImage && (
            <div className="rounded-xl overflow-hidden">
              <img src={blog.coverImage} alt={blog.title} className="w-full h-48 object-cover" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{blog.title}</h3>
              {blog.featured && (
                <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white text-xs">★</span>
                </div>
              )}
            </div>
            {blog.excerpt && (
              <p className="text-gray-600 dark:text-gray-300 italic">{blog.excerpt}</p>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            <Badge variant={blog.status === 'PUBLISHED' ? 'success' : 'warning'} size="sm">
              {blog.status === 'PUBLISHED' ? 'Published' : 'Draft'}
            </Badge>
            {(blog.categories || []).map((cat, i) => (
              <Badge key={i} variant="primary" size="sm">{getCategoryName(cat)}</Badge>
            ))}
          </div>

          {blog.content && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={16} className="text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Content</span>
              </div>
              {isHtmlContent ? (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-12 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-gray-300 dark:[&_th]:border-gray-600 [&_th]:p-2 [&_td]:border [&_td]:border-gray-300 dark:[&_td]:border-gray-600 [&_td]:p-2 [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-4 [&_blockquote]:italic"
                  dangerouslySetInnerHTML={{ __html: safeContent }}
                />
              ) : (
                <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed line-clamp-12">
                  {blog.content}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {blog.author?.name && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <User size={16} className="text-gray-500 dark:text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Author</span>
                </div>
                <p className="text-sm font-medium text-gray-800 dark:text-white">{blog.author.name}</p>
              </div>
            )}
            {blog.slug && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Globe size={16} className="text-gray-500 dark:text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Slug</span>
                </div>
                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{blog.slug}</p>
              </div>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={18} className="text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dates</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Created</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white">{formatDateShort(blog.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Last Updated</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white">{formatDateShort(blog.updatedAt)}</span>
              </div>
            </div>
          </div>

          {(blog.gallery || []).length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Tag size={18} className="text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Gallery</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {blog.gallery.map((img, i) => (
                  <div key={i} className="rounded-lg overflow-hidden aspect-square bg-gray-200 dark:bg-gray-700">
                    <img src={img.url || img} alt={img.altText || ''} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {blog.metaTitle && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SEO</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Meta Title</p>
                  <p className="text-sm text-gray-800 dark:text-white">{blog.metaTitle}</p>
                </div>
                {blog.metaDescription && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Meta Description</p>
                    <p className="text-sm text-gray-800 dark:text-white line-clamp-2">{blog.metaDescription}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

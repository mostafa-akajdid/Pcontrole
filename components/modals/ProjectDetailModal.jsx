import { useState, useEffect } from 'react';
import { X, Calendar, MapPin, User, Globe, Tag, ExternalLink } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import { formatDateShort, getCategoryName } from '@/lib/utils';

export default function ProjectDetailModal({ isOpen, onClose, project }) {
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
  if (!project) return null;

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
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Project Details</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">View project information</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {project.coverImage && (
            <div className="rounded-xl overflow-hidden">
              <img src={project.coverImage} alt={project.title} className="w-full h-48 object-cover" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{project.title}</h3>
              {project.featured && (
                <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white text-xs">★</span>
                </div>
              )}
            </div>
            {project.shortDescription && (
              <p className="text-gray-600 dark:text-gray-300">{project.shortDescription}</p>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            <Badge variant={project.status === 'PUBLISHED' ? 'success' : 'warning'} size="sm">
              {project.status === 'PUBLISHED' ? 'Published' : 'Draft'}
            </Badge>
            {(project.categories || []).map((cat, i) => (
              <Badge key={i} variant="primary" size="sm">{getCategoryName(cat)}</Badge>
            ))}
          </div>

          {(() => {
            const rawDesc = project.fullDescription || project.description;
            if (!rawDesc) return null;
            const desc = typeof rawDesc === 'object' && rawDesc !== null
              ? rawDesc
              : typeof rawDesc === 'string'
                ? { type: 'paragraph', content: rawDesc }
                : null;
            if (!desc) return null;
            return (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</h4>
                {desc.type === 'paragraph' ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                    {desc.content}
                  </p>
                ) : desc.type === 'list' ? (
                  <ul className="space-y-1.5">
                    {(desc.items || []).map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 mt-1.5 flex-shrink-0" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })()}

          <div className="grid grid-cols-2 gap-4">
            {project.client && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <User size={16} className="text-gray-500 dark:text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Client</span>
                </div>
                <p className="text-sm font-medium text-gray-800 dark:text-white">{project.client}</p>
              </div>
            )}
            {project.location && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin size={16} className="text-gray-500 dark:text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Location</span>
                </div>
                <p className="text-sm font-medium text-gray-800 dark:text-white">{project.location}</p>
              </div>
            )}
            {project.year && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar size={16} className="text-gray-500 dark:text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Year</span>
                </div>
                <p className="text-sm font-medium text-gray-800 dark:text-white">{project.year}</p>
              </div>
            )}
            {project.slug && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Globe size={16} className="text-gray-500 dark:text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Slug</span>
                </div>
                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{project.slug}</p>
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
                <span className="text-sm font-medium text-gray-800 dark:text-white">{formatDateShort(project.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Last Updated</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white">{formatDateShort(project.updatedAt)}</span>
              </div>
            </div>
          </div>

          {(project.gallery || []).length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Tag size={18} className="text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Gallery</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {project.gallery.map((img, i) => (
                  <div key={i} className="rounded-lg overflow-hidden aspect-square bg-gray-200 dark:bg-gray-700">
                    <img src={img.url || img} alt={img.altText || ''} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {project.metaTitle && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SEO</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Meta Title</p>
                  <p className="text-sm text-gray-800 dark:text-white">{project.metaTitle}</p>
                </div>
                {project.metaDescription && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Meta Description</p>
                    <p className="text-sm text-gray-800 dark:text-white line-clamp-2">{project.metaDescription}</p>
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

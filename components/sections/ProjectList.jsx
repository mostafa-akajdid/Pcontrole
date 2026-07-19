import Link from 'next/link';
import { FileText, Tag } from 'lucide-react';
import { useAppearance } from '@/contexts/AppearanceContext';
import { STATUS_COLORS, getRelativeTime } from '@/lib/utils';

export default function ProjectList({ data }) {
  const { accentColor } = useAppearance();
  const projects = data?.recentProjects || [];

  if (projects.length === 0) {
    return (
      <div className="h-[400px] flex flex-col bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Recent Projects</h3>
          <Link href="/dashboard/projects" className="text-xs border border-gray-200 dark:border-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            View All
          </Link>
        </div>
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <div className="text-center">
            <FileText size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">No projects yet</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[400px] flex flex-col bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Recent Projects</h3>
        <Link href="/dashboard/projects" className="text-xs border border-gray-200 dark:border-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          View All
        </Link>
      </div>
      
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/dashboard/projects/${project.id}`}
            className="block p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div 
                className="mt-1 min-w-[32px] h-8 rounded-lg flex items-center justify-center"
                style={{ 
                  backgroundColor: `${accentColor}15`,
                  color: accentColor 
                }}
              >
                <FileText size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h5 className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">
                    {project.title}
                  </h5>
                  {project.featured && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      Featured
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-gray-500">
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[project.status] || STATUS_COLORS.DRAFT}`}>
                    {project.status}
                  </span>
                  <span>{getRelativeTime(project.createdAt)}</span>
                </div>
                {project.categories?.length > 0 && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <Tag size={10} className="text-gray-400" />
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                      {project.categories.map(c => c.name).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

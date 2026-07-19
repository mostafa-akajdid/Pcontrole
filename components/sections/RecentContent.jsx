import Link from 'next/link';
import { Newspaper, FileText } from 'lucide-react';
import { useAppearance } from '@/contexts/AppearanceContext';
import { STATUS_COLORS, getRelativeTime } from '@/lib/utils';

function ContentItem({ item, type, accentColor }) {
  const Icon = type === 'blog' ? Newspaper : FileText;
  const href = type === 'blog' ? `/dashboard/blogs/${item.id}` : `/dashboard/projects/${item.id}`;
  
  return (
    <Link href={href} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      {item.coverImage ? (
        <img src={item.coverImage} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
        >
          <Icon size={16} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{item.title}</p>
        <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500">
          <span className={`px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[item.status] || STATUS_COLORS.DRAFT}`}>
            {item.status}
          </span>
          <span>{getRelativeTime(item.createdAt)}</span>
        </div>
      </div>
      {item.author && (
        <div className="flex-shrink-0">
          {item.author.avatar ? (
            <img src={item.author.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-[10px] font-bold text-gray-400">{item.author.name?.charAt(0)}</span>
            </div>
          )}
        </div>
      )}
    </Link>
  );
}

export default function RecentContent({ data }) {
  const { accentColor } = useAppearance();
  const recentProjects = data?.recentProjects || [];
  const recentBlogs = data?.recentBlogs || [];

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Latest Content</h3>
        <div className="flex gap-2">
          <Link href="/dashboard/projects" className="text-[10px] border border-gray-200 dark:border-gray-600 px-2.5 py-1 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Projects
          </Link>
          <Link href="/dashboard/blogs" className="text-[10px] border border-gray-200 dark:border-gray-600 px-2.5 py-1 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Blogs
          </Link>
        </div>
      </div>

      <div className="space-y-1">
        {recentProjects.length === 0 && recentBlogs.length === 0 ? (
          <div className="text-center py-8">
            <FileText size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">No content yet</p>
          </div>
        ) : (
          [...recentProjects.slice(0, 3), ...recentBlogs.slice(0, 3)]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5)
            .map((item) => {
              const isProject = recentProjects.some(p => p.id === item.id);
              return (
                <ContentItem 
                  key={item.id} 
                  item={item} 
                  type={isProject ? 'project' : 'blog'} 
                  accentColor={accentColor}
                />
              );
            })
        )}
      </div>
    </div>
  );
}

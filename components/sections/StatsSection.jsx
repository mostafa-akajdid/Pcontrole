import Link from 'next/link';
import StatCard from '@/components/ui/StatCard';

export default function StatsSection({ data, loading }) {
  const stats = data?.stats;

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-8">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-5 rounded-3xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 animate-pulse">
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-8">
      <Link href="/dashboard/projects">
        <StatCard
          title="Total Projects"
          value={String(stats.projects?.total || 0)}
          trend={`${stats.projects?.published || 0} published`}
          subtext={`${stats.projects?.draft || 0} drafts`}
          active
        />
      </Link>
      <Link href="/dashboard/blogs">
        <StatCard
          title="Total Blogs"
          value={String(stats.blogs?.total || 0)}
          trend={`${stats.blogs?.published || 0} published`}
          subtext={`${stats.blogs?.draft || 0} drafts`}
        />
      </Link>
      <Link href="/dashboard/media">
        <StatCard
          title="Media Assets"
          value={String(stats.media?.total || 0)}
          trend="Library"
          subtext="files uploaded"
        />
      </Link>
      <Link href="/dashboard/users">
        <StatCard
          title="Team Members"
          value={String(stats.users?.total || 0)}
          trend={`${stats.users?.active || 0} active`}
          subtext="registered users"
        />
      </Link>
      <Link href="/dashboard/projects?status=PUBLISHED">
        <StatCard
          title="Published"
          value={String(stats.projects?.published || 0)}
          trend="Live"
          subtext="projects"
        />
      </Link>
    </div>
  );
}

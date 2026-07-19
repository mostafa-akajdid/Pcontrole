import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsSection from '@/components/sections/StatsSection';
import AnalyticsChart from '@/components/sections/AnalyticsChart';
import RemindersCard from '@/components/sections/RemindersCard';
import ProjectList from '@/components/sections/ProjectList';
import TeamCollaboration from '@/components/sections/TeamCollaboration';
import ProjectProgress from '@/components/sections/ProjectProgress';
import TimeTracker from '@/components/sections/TimeTracker';
import SystemHealthCard from '@/components/sections/SystemHealthCard';
import RoleDistributionChart from '@/components/sections/RoleDistributionChart';
import QuickActions from '@/components/sections/QuickActions';
import GlobalSearchWidget from '@/components/sections/GlobalSearchWidget';
import RecentNotifications from '@/components/sections/RecentNotifications';
import RecentAudit from '@/components/sections/RecentAudit';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    
    async function fetchOverview() {
      try {
        const res = await fetch('/api/dashboard/overview');
        const json = await res.json();
        if (!cancelled && json.success) {
          setData(json.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    
    fetchOverview();
    return () => { cancelled = true; };
  }, []);

  return (
    <DashboardLayout
      title="Dashboard - Project Management"
      description="Plan, prioritize, and accomplish your tasks with ease. Track your projects, team collaboration, and analytics in one place."
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {loading ? 'Loading overview...' : 'Your command center at a glance.'}
          </p>
        </div>
        <div className="w-full md:w-auto">
          <GlobalSearchWidget />
        </div>
      </div>

      <StatsSection data={data} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-5">
          <AnalyticsChart data={data} />
        </div>
        <div className="lg:col-span-3">
          <RemindersCard data={data} />
        </div>
        <div className="lg:col-span-4">
          <ProjectList data={data} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <TeamCollaboration data={data} loading={loading} />
        <RoleDistributionChart data={data} />
        <RecentNotifications data={data} />
        <RecentAudit data={data} />
        <ProjectProgress data={data} />
        <SystemHealthCard data={data} />
        <TimeTracker data={data} />
        <QuickActions />
      </div>
    </DashboardLayout>
  );
}

import { useState, useEffect } from 'react';
import { ClipboardList, FolderKanban, FileText, Image, Users, Shield, Settings } from 'lucide-react';
import { getRelativeTime } from '@/lib/utils';
import Link from 'next/link';

const moduleIcons = {
  projects: FolderKanban,
  blogs: FileText,
  media: Image,
  users: Users,
  roles: Shield,
  settings: Settings,
};

const actionColors = {
  CREATE: 'text-green-600 bg-green-50',
  UPDATE: 'text-blue-600 bg-blue-50',
  DELETE: 'text-red-600 bg-red-50',
  PUBLISH: 'text-purple-600 bg-purple-50',
};

export default function RecentAudit({ data }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (data?.recentAuditLogs) {
      setLogs(data.recentAuditLogs);
    }
  }, [data]);

  if (logs.length === 0) {
    return (
      <div className="h-[350px] flex flex-col bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="font-semibold text-gray-800 text-sm">Recent Activity</h3>
          <Link href="/dashboard/audit" className="text-xs text-blue-500 hover:text-blue-700">
            View all
          </Link>
        </div>
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-gray-400">
          <ClipboardList size={24} className="mb-2" />
          <p className="text-sm">No activity yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[350px] flex flex-col bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="font-semibold text-gray-800 text-sm">Recent Activity</h3>
        <Link href="/dashboard/audit" className="text-xs text-blue-500 hover:text-blue-700">
          View all
        </Link>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
        {logs.slice(0, 5).map((log) => {
          const Icon = moduleIcons[log.module] || ClipboardList;
          return (
            <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${actionColors[log.action] || 'text-gray-500 bg-gray-100'}`}>
                <Icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${actionColors[log.action] || 'text-gray-600 bg-gray-100'}`}>
                    {log.action}
                  </span>
                  <span className="text-sm text-gray-700">{log.entityType}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500">{log.user?.name || 'Unknown'}</span>
                  <span className="text-[10px] text-gray-400">{getRelativeTime(log.createdAt)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

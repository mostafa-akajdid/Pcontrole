import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ClipboardList, Filter, Download, ChevronDown, ChevronUp, User, FolderKanban, FileText, Image, Users, Shield, Settings, Bell, Inbox } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const moduleIcons = {
  projects: FolderKanban,
  blogs: FileText,
  media: Image,
  users: Users,
  roles: Shield,
  settings: Settings,
  notifications: Bell,
};

const actionColors = {
  CREATE: 'text-green-600 bg-green-50',
  UPDATE: 'text-blue-600 bg-blue-50',
  DELETE: 'text-red-600 bg-red-50',
  PUBLISH: 'text-purple-600 bg-purple-50',
  RESTORE: 'text-amber-600 bg-amber-50',
};

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ today: 0, thisWeek: 0, thisMonth: 0, total: 0 });
  const [moduleCounts, setModuleCounts] = useState([]);
  const [filterModule, setFilterModule] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const perPage = 15;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
      if (filterModule !== 'all') params.set('module', filterModule);
      if (filterAction !== 'all') params.set('action', filterAction);

      const res = await fetch(`/api/audit?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setLogs(json.data.items);
        setTotalPages(json.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/audit/stats');
      const json = await res.json();
      if (json.success) {
        setStats(json.data.stats);
        setModuleCounts(json.data.moduleCounts);
      }
    } catch (err) {
      console.error('Failed to fetch audit stats:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [page, filterModule, filterAction]);

  const getRelativeTime = (dateStr) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return '';
    }
  };

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), 'MMM d, yyyy HH:mm:ss');
    } catch {
      return dateStr;
    }
  };

  const formatJson = (obj) => {
    if (!obj) return null;
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const getDiff = (oldValues, newValues) => {
    if (!oldValues && !newValues) return null;
    const changes = [];
    const allKeys = new Set([...Object.keys(oldValues || {}), ...Object.keys(newValues || {})]);
    for (const key of allKeys) {
      const oldVal = oldValues?.[key];
      const newVal = newValues?.[key];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes.push({ key, old: oldVal, new: newVal });
      }
    }
    return changes.length > 0 ? changes : null;
  };

  return (
    <DashboardLayout title="Audit Log" description="Track all changes and user activity across the system.">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">Audit Log</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Complete history of all system changes and user actions.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Today', value: stats.today, color: 'text-blue-600' },
          { label: 'This Week', value: stats.thisWeek, color: 'text-green-600' },
          { label: 'This Month', value: stats.thisMonth, color: 'text-purple-600' },
          { label: 'All Time', value: stats.total, color: 'text-gray-800' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Module Breakdown */}
      {moduleCounts.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Activity by Module</h3>
          <div className="flex flex-wrap gap-3">
            {moduleCounts.map((mc) => {
              const Icon = moduleIcons[mc.module] || ClipboardList;
              return (
                <div key={mc.module} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <Icon size={14} className="text-gray-500" />
                  <span className="text-sm text-gray-700 capitalize">{mc.module}</span>
                  <span className="text-sm font-semibold text-gray-900">{mc.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={filterModule}
          onChange={(e) => { setFilterModule(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Modules</option>
          <option value="projects">Projects</option>
          <option value="blogs">Blogs</option>
          <option value="media">Media</option>
          <option value="users">Users</option>
          <option value="roles">Roles</option>
          <option value="settings">Settings</option>
        </select>
        <select
          value={filterAction}
          onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="PUBLISH">Publish</option>
        </select>
      </div>

      {/* Audit Log List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium mb-1">No audit logs found</p>
            <p className="text-gray-400 text-sm">No activity matches your current filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {logs.map((log) => {
              const ModuleIcon = moduleIcons[log.module] || ClipboardList;
              const diff = getDiff(log.oldValues, log.newValues);
              const isExpanded = expandedId === log.id;
              return (
                <div key={log.id} className="hover:bg-gray-50 transition-colors">
                  <div
                    className="px-6 py-4 flex items-start gap-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${actionColors[log.action] || 'text-gray-500 bg-gray-100'}`}>
                      <ModuleIcon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${actionColors[log.action] || 'text-gray-600 bg-gray-100'}`}>
                          {log.action}
                        </span>
                        <span className="text-sm font-medium text-gray-800">{log.entityType}</span>
                        {log.entityId && (
                          <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                            {log.entityId.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1.5">
                          {log.user?.avatar ? (
                            <img src={log.user.avatar} alt="" className="w-5 h-5 rounded-full" />
                          ) : (
                            <User size={14} className="text-gray-400" />
                          )}
                          <span className="text-xs text-gray-600">{log.user?.name || 'Unknown'}</span>
                        </div>
                        <span className="text-xs text-gray-400">{getRelativeTime(log.createdAt)}</span>
                        <span className="text-xs text-gray-400 hidden sm:inline">{formatDate(log.createdAt)}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-6 pb-4 ml-14">
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        {diff && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-600 mb-2">Changes</h4>
                            <div className="space-y-2">
                              {diff.map((d) => (
                                <div key={d.key} className="flex items-start gap-2 text-sm">
                                  <span className="font-mono text-gray-700 min-w-[120px]">{d.key}</span>
                                  <span className="text-red-500 line-through break-all">{d.old !== undefined ? JSON.stringify(d.old) : '—'}</span>
                                  <span className="text-gray-400">→</span>
                                  <span className="text-green-600 break-all">{d.new !== undefined ? JSON.stringify(d.new) : '—'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {log.oldValues && !diff && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-600 mb-1">Previous Values</h4>
                            <pre className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200 overflow-x-auto max-h-40 overflow-y-auto">
                              {formatJson(log.oldValues)}
                            </pre>
                          </div>
                        )}
                        {log.newValues && !diff && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-600 mb-1">New Values</h4>
                            <pre className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200 overflow-x-auto max-h-40 overflow-y-auto">
                              {formatJson(log.newValues)}
                            </pre>
                          </div>
                        )}
                        {log.ipAddress && (
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">IP:</span> {log.ipAddress}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

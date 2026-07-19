import { useState, useEffect } from 'react';
import { Server, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Card from '@/components/ui/Card';
import { useApi } from '@/hooks/useApi';

function StatusBadge({ status }) {
  const configs = {
    connected: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    configured: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    error: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
    not_configured: { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    disconnected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
  };

  const config = configs[status] || configs.not_configured;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.color}`}>
      <Icon size={14} />
      {status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}

export default function SystemInfo() {
  const { get, loading } = useApi();
  const [info, setInfo] = useState(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const result = await get('/api/settings/system-info');
        if (result?.success) {
          setInfo(result.data);
        }
      } catch (e) {
        console.warn('Failed to load system info:', e);
      }
    };
    fetchInfo();
  }, [get]);

  if (loading && !info) {
    return (
      <Card>
        <div className="flex items-center gap-3 p-6">
          <Server size={20} className="text-gray-400 animate-pulse" />
          <p className="text-gray-500">Loading system information...</p>
        </div>
      </Card>
    );
  }

  if (!info) {
    return (
      <Card>
        <div className="p-6 text-center text-gray-500">Failed to load system information</div>
      </Card>
    );
  }

  const items = [
    { label: 'CMS Version', value: info.version },
    { label: 'Node.js Version', value: info.nodeVersion },
    { label: 'Database Provider', value: info.databaseProvider },
    { label: 'Database Version', value: info.databaseVersion },
    { label: 'Environment', value: info.environment },
  ];

  const services = [
    { label: 'Database', status: info.databaseStatus },
    { label: 'Cloudinary', status: info.cloudinaryStatus },
    { label: 'SMTP', status: info.smtpStatus },
  ];

  return (
    <Card padding="none">
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Server size={20} className="text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">System Information</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Read-only system status</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {items.map((item) => (
            <div key={item.label} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.value}</span>
            </div>
          ))}
        </div>

        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Service Status</h4>
        <div className="space-y-3">
          {services.map((service) => (
            <div key={service.label} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{service.label}</span>
              <StatusBadge status={service.status} />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

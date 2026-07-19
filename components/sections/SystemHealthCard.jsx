import { Database, Cloud, Mail, Server, Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useAppearance } from '@/contexts/AppearanceContext';

const STATUS_CONFIG = {
  connected: { icon: CheckCircle, color: 'text-green-500', label: 'Connected' },
  configured: { icon: CheckCircle, color: 'text-green-500', label: 'Configured' },
  not_configured: { icon: XCircle, color: 'text-yellow-500', label: 'Not Configured' },
  disconnected: { icon: XCircle, color: 'text-red-500', label: 'Disconnected' },
  error: { icon: AlertTriangle, color: 'text-red-500', label: 'Error' },
};

const SERVICES = [
  { key: 'database', label: 'Database', icon: Database, serviceKey: 'database' },
  { key: 'cloudinary', label: 'Cloudinary', icon: Cloud, serviceKey: 'cloudinary' },
  { key: 'smtp', label: 'SMTP', icon: Mail, serviceKey: 'smtp' },
];

export default function SystemHealthCard({ data }) {
  const { accentColor } = useAppearance();
  const health = data?.systemHealth;

  if (!health) return null;

  const allGreen = health.database === 'connected' && 
    (health.cloudinary === 'configured' || !health.cloudinary) &&
    (health.smtp === 'configured' || !health.smtp);

  return (
    <div className="h-[350px] flex flex-col bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <Server size={18} className="text-gray-400" />
          <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">System Health</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {allGreen ? (
            <span className="text-[10px] px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">
              All Systems Operational
            </span>
          ) : (
            <span className="text-[10px] px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 font-medium">
              Some Issues Detected
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
        {SERVICES.map((svc) => {
          const status = health[svc.serviceKey];
          const config = STATUS_CONFIG[status] || STATUS_CONFIG.not_configured;
          const StatusIcon = config.icon;
          const ServiceIcon = svc.icon;
          
          return (
            <div key={svc.key} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-600 flex items-center justify-center">
                  <ServiceIcon size={16} className="text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{svc.label}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 capitalize">
                    {status?.replace('_', ' ') || 'Unknown'}
                  </p>
                </div>
              </div>
              <StatusIcon size={16} className={config.color} />
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Shield size={12} />
            <span>Environment: <span className="font-medium capitalize">{health.environment || 'development'}</span></span>
          </div>
          {health.maintenanceMode && (
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-medium">
              Maintenance Mode
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

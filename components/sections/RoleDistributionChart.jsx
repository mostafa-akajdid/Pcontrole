import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Users } from 'lucide-react';
import { useAppearance } from '@/contexts/AppearanceContext';

const ROLE_COLORS = [
  '#0f4c3a', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#10b981', '#ec4899', '#06b6d4', '#f97316', '#6366f1',
];

export default function RoleDistributionChart({ data }) {
  const { accentColor } = useAppearance();
  const roleDistribution = data?.stats?.users?.roleDistribution || [];

  const chartData = roleDistribution
    .filter(r => r.count > 0)
    .map((r, i) => ({
      name: r.roleName,
      value: r.count,
      color: ROLE_COLORS[i % ROLE_COLORS.length],
    }));

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  if (chartData.length === 0) {
    return (
      <div className="h-[350px] flex flex-col bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 mb-4 shrink-0">
          <Users size={18} className="text-gray-400" />
          <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Team by Role</h3>
        </div>
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <div className="text-center">
            <Users size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">No users yet</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[350px] flex flex-col bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <Users size={18} className="text-gray-400" />
        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Team by Role</h3>
      </div>
      
      <div className="flex-1 min-h-0 flex items-center gap-4">
        <div className="w-28 h-28 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={50}
                dataKey="value"
                stroke="none"
                paddingAngle={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontSize: '12px',
                }}
                formatter={(value, name) => [`${value} users`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex-1 space-y-2">
          {chartData.map((entry) => {
            const percentage = total > 0 ? Math.round((entry.value / total) * 100) : 0;
            return (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="text-xs text-gray-600 dark:text-gray-300 flex-1 truncate">{entry.name}</span>
                <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{entry.value}</span>
                <span className="text-[10px] text-gray-400 w-8 text-right">{percentage}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

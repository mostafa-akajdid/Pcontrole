import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAppearance } from '@/contexts/AppearanceContext';

export default function AnalyticsChart({ data }) {
  const { accentColor } = useAppearance();
  const trendData = data?.activityTrend?.slice(-14) || [];
  
  const chartData = trendData.map(d => ({
    name: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    count: d.count,
    date: d.date,
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-[400px] flex flex-col bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="mb-6 shrink-0">
          <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Activity Analytics</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Daily activity over the last 2 weeks</p>
        </div>
        <div className="flex-1 min-h-0 flex items-center justify-center text-gray-400 text-sm">
          No activity data yet
        </div>
      </div>
    );
  }

  return (
    <div className="h-[400px] flex flex-col bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="mb-6 shrink-0">
        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Activity Analytics</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Daily activity over the last 2 weeks</p>
      </div>
      
      <div className="flex-1 min-h-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="#f0f0f0" 
            />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#9ca3af', fontSize: 12}} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#9ca3af', fontSize: 12}}
              allowDecimals={false}
            />
            <Tooltip 
              cursor={{fill: 'transparent'}} 
              contentStyle={{
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              formatter={(value) => [`${value} actions`, 'Activity']}
              labelFormatter={(label) => label}
            />
            <Bar dataKey="count" radius={[20, 20, 20, 20]} barSize={28} fill={accentColor}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fillOpacity={0.8 + (index / chartData.length) * 0.2} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

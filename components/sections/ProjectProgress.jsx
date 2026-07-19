import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useAppearance } from '@/contexts/AppearanceContext';

export default function ProjectProgress({ data }) {
  const { accentColor } = useAppearance();
  const contentSummary = data?.contentSummary;
  
  const published = contentSummary?.projects?.published || 0;
  const draft = contentSummary?.projects?.draft || 0;
  const total = published + draft;
  const publishRate = contentSummary?.projects?.publishRate || 0;

  const progressData = total > 0 ? [
    { name: 'Published', value: published, color: accentColor },
    { name: 'Draft', value: draft, color: '#e5e7eb' },
  ] : [
    { name: 'Published', value: 0, color: accentColor },
    { name: 'No Data', value: 1, color: '#e5e7eb' },
  ];

  return (
    <div className="h-[350px] flex flex-col bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
      <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-2 shrink-0">Content Summary</h3>
      
      <div className="flex-1 min-h-0 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={progressData}
              cx="50%"
              cy="50%"
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              {progressData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                  cornerRadius={10} 
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center mt-4">
          <span className="text-3xl font-bold text-gray-800 dark:text-gray-200">{publishRate}%</span>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">Publish Rate</p>
        </div>
      </div>
      
      <div className="flex justify-center gap-4 text-[10px]">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }}></div>
          <span className="text-gray-500 dark:text-gray-400">Published ({published})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600"></div>
          <span className="text-gray-500 dark:text-gray-400">Draft ({draft})</span>
        </div>
      </div>
      
      {contentSummary?.recentlyUpdated?.projects?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Recently Updated</p>
          {contentSummary.recentlyUpdated.projects.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-xs py-1">
              <span className="text-gray-600 dark:text-gray-300 truncate max-w-[140px]">{p.title}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                p.status === 'PUBLISHED' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

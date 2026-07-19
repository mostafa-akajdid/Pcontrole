import { TrendingUp, TrendingDown, Users, CheckCircle, Clock, Target } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAppearance } from '@/contexts/AppearanceContext';

const performanceData = [
  { month: 'Jan', completed: 45, inProgress: 12, total: 57 },
  { month: 'Feb', completed: 52, inProgress: 15, total: 67 },
  { month: 'Mar', completed: 48, inProgress: 18, total: 66 },
  { month: 'Apr', completed: 61, inProgress: 14, total: 75 },
  { month: 'May', completed: 55, inProgress: 20, total: 75 },
  { month: 'Jun', completed: 67, inProgress: 16, total: 83 },
];

const teamProductivity = [
  { name: 'Sarah Johnson', tasks: 24, completed: 20, efficiency: 83 },
  { name: 'Mike Chen', tasks: 28, completed: 25, efficiency: 89 },
  { name: 'Emma Wilson', tasks: 22, completed: 18, efficiency: 82 },
  { name: 'John Doe', tasks: 26, completed: 22, efficiency: 85 },
  { name: 'Alex Brown', tasks: 20, completed: 16, efficiency: 80 },
];

export default function Analytics() {
  const { accentColor } = useAppearance();
  
  // Dynamic project status data with accent color
  const projectStatusData = [
    { name: 'Completed', value: 45, color: accentColor },
    { name: 'In Progress', value: 30, color: '#06b6d4' },
    { name: 'Pending', value: 15, color: '#f59e0b' },
    { name: 'On Hold', value: 10, color: '#ef4444' },
  ];
  return (
    <DashboardLayout
      title="Analytics - Project Management"
      description="Track performance metrics and insights"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-1">Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Track your team's performance and project insights</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Projects</p>
              <p className="text-2xl font-bold text-black dark:text-white">83</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Target className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
            <TrendingUp size={16} />
            <span>+12% from last month</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Completed</p>
              <p className="text-2xl font-bold text-black dark:text-white">67</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
            <TrendingUp size={16} />
            <span>+8% from last month</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">In Progress</p>
              <p className="text-2xl font-bold text-black dark:text-white">16</p>
            </div>
            <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center">
              <Clock className="text-cyan-600 dark:text-cyan-400" size={24} />
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
            <TrendingDown size={16} />
            <span>-3% from last month</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Team Members</p>
              <p className="text-2xl font-bold text-black dark:text-white">24</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <Users className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
            <TrendingUp size={16} />
            <span>+2 new members</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Project Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-700" />
              <XAxis dataKey="month" stroke="#9ca3af" className="dark:stroke-gray-500" />
              <YAxis stroke="#9ca3af" className="dark:stroke-gray-500" />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill={accentColor} name="Completed" radius={[8, 8, 0, 0]} />
              <Bar dataKey="inProgress" fill="#06b6d4" name="In Progress" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          
          {/* Performance Summary */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Average Completion</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">54.7</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">per month</p>
              </div>
              <div className="text-center border-x border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Success Rate</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">80.7%</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">completion rate</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Best Month</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">June</p>
                <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-1">67 completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Project Status Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Project Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={projectStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {projectStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {projectStatusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-semibold text-gray-800">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Productivity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Team Productivity</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Team Member</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Total Tasks</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Completed</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Efficiency</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {teamProductivity.map((member) => (
                <tr key={member.name} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-4 font-medium text-gray-800 dark:text-white">{member.name}</td>
                  <td className="px-4 py-4 text-gray-600 dark:text-gray-400">{member.tasks}</td>
                  <td className="px-4 py-4 text-gray-600 dark:text-gray-400">{member.completed}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      member.efficiency >= 85 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 
                      member.efficiency >= 80 ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400' : 
                      'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                    }`}>
                      {member.efficiency}%
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${member.efficiency}%`, backgroundColor: accentColor }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

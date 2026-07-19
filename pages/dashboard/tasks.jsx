import { useState, useRef, useEffect } from 'react';
import { Plus, Search, MoreVertical, CheckCircle2, Circle, Clock, AlertCircle, Edit2, Trash2, Eye } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AddProjectModal from '@/components/modals/AddProjectModal';
import AddTaskModal from '@/components/modals/AddTaskModal';
import { useAppearance } from '@/contexts/AppearanceContext';

const taskData = [
  { id: 1, title: 'Design new landing page', project: 'Website Redesign', priority: 'High', status: 'in-progress', dueDate: '2024-11-30', assignee: 'Sarah Johnson' },
  { id: 2, title: 'Fix authentication bug', project: 'Backend API', priority: 'Critical', status: 'in-progress', dueDate: '2024-11-28', assignee: 'Mike Chen' },
  { id: 3, title: 'Update documentation', project: 'Documentation', priority: 'Low', status: 'todo', dueDate: '2024-12-05', assignee: 'Emma Wilson' },
  { id: 4, title: 'Implement payment gateway', project: 'E-commerce', priority: 'High', status: 'in-progress', dueDate: '2024-12-01', assignee: 'John Doe' },
  { id: 5, title: 'Code review for PR #234', project: 'Backend API', priority: 'Medium', status: 'todo', dueDate: '2024-11-29', assignee: 'Sarah Johnson' },
  { id: 6, title: 'Setup CI/CD pipeline', project: 'DevOps', priority: 'High', status: 'completed', dueDate: '2024-11-25', assignee: 'Mike Chen' },
  { id: 7, title: 'Mobile app testing', project: 'Mobile App', priority: 'Medium', status: 'in-progress', dueDate: '2024-12-03', assignee: 'Emma Wilson' },
  { id: 8, title: 'Database optimization', project: 'Backend API', priority: 'Medium', status: 'completed', dueDate: '2024-11-24', assignee: 'John Doe' },
];

const statusConfig = {
  'todo': { label: 'To Do', icon: Circle, color: 'text-gray-500', bg: 'bg-gray-100' },
  'in-progress': { label: 'In Progress', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-100' },
  'completed': { label: 'Completed', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-100' },
};

const priorityConfig = {
  'Low': { color: 'text-gray-600', bg: 'bg-gray-100' },
  'Medium': { color: 'text-blue-600', bg: 'bg-blue-100' },
  'High': { color: 'text-orange-600', bg: 'bg-orange-100' },
  'Critical': { color: 'text-red-600', bg: 'bg-red-100' },
};

export default function Tasks() {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);
  const { accentColor } = useAppearance();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  const handleCreateProject = (projectData) => {
    setShowAddProject(false);
  };

  const handleCreateTask = (taskData) => {
    setShowAddTask(false);
  };

  const handleMenuAction = (action, taskId) => {
    setOpenMenuId(null);
  };

  const filteredTasks = taskData.filter(task => {
    const matchesFilter = filter === 'all' || task.status === filter;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.project.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: taskData.length,
    todo: taskData.filter(t => t.status === 'todo').length,
    inProgress: taskData.filter(t => t.status === 'in-progress').length,
    completed: taskData.filter(t => t.status === 'completed').length,
  };

  return (
    <DashboardLayout
      title="Tasks - Project Management"
      description="Manage and track all your tasks in one place"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Tasks</h1>
          <p className="text-gray-500 text-sm">Manage and track all your tasks</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowAddTask(true)}
            className="flex items-center gap-2 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-all shadow-lg"
            style={{ backgroundColor: accentColor }}
          >
            <Plus size={16} /> New Task
          </button>
          <button 
            onClick={() => setShowAddProject(true)}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 transition-colors"
          >
            <Plus size={16} /> Add Project
          </button>
        </div>
      </div>

      {/* Stats Cards - Minimalist Design */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-sm transition-shadow">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Total Tasks</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            <div className="w-10 h-10 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <AlertCircle className="text-gray-400 dark:text-gray-500" size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-sm transition-shadow">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">To Do</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.todo}</p>
            <div className="w-10 h-10 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <Circle className="text-gray-400 dark:text-gray-500" size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-sm transition-shadow">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">In Progress</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.inProgress}</p>
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Clock className="text-blue-500 dark:text-blue-400" size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-sm transition-shadow">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Completed</p>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
            <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="text-green-500 dark:text-green-400" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl p-4 mb-6 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'all' ? 'text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              style={filter === 'all' ? { backgroundColor: accentColor } : {}}
            >
              All
            </button>
            <button
              onClick={() => setFilter('todo')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'todo' ? 'text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              style={filter === 'todo' ? { backgroundColor: accentColor } : {}}
            >
              To Do
            </button>
            <button
              onClick={() => setFilter('in-progress')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'in-progress' ? 'text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              style={filter === 'in-progress' ? { backgroundColor: accentColor } : {}}
            >
              In Progress
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'completed' ? 'text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              style={filter === 'completed' ? { backgroundColor: accentColor } : {}}
            >
              Completed
            </button>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Task</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Project</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Priority</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Due Date</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Assignee</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredTasks.map((task) => {
                const StatusIcon = statusConfig[task.status].icon;
                return (
                  <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-accent focus:ring-accent bg-white dark:bg-gray-700" />
                        <span className="font-medium text-gray-800 dark:text-gray-200">{task.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{task.project}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[task.status].bg} ${statusConfig[task.status].color}`}>
                        <StatusIcon size={14} />
                        {statusConfig[task.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${priorityConfig[task.priority].bg} ${priorityConfig[task.priority].color}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{task.dueDate}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{task.assignee}</td>
                    <td className="px-6 py-4">
                      <div className="relative" ref={openMenuId === task.id ? menuRef : null}>
                        <button 
                          onClick={() => setOpenMenuId(openMenuId === task.id ? null : task.id)}
                          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <MoreVertical size={18} />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {openMenuId === task.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-menu-in">
                            <button
                              onClick={() => handleMenuAction('view', task.id)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <Eye size={16} className="text-gray-500 dark:text-gray-400" />
                              View Details
                            </button>
                            <button
                              onClick={() => handleMenuAction('edit', task.id)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <Edit2 size={16} className="text-gray-500 dark:text-gray-400" />
                              Edit Task
                            </button>
                            <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                            <button
                              onClick={() => handleMenuAction('delete', task.id)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <Trash2 size={16} />
                              Delete Task
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Task Modal */}
      <AddTaskModal 
        isOpen={showAddTask}
        onClose={() => setShowAddTask(false)}
        onSubmit={handleCreateTask}
      />

      {/* Add Project Modal */}
      <AddProjectModal 
        isOpen={showAddProject}
        onClose={() => setShowAddProject(false)}
        onSubmit={handleCreateProject}
      />
    </DashboardLayout>
  );
}

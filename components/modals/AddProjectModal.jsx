import { useState, useEffect, useCallback } from 'react';
import { X, Calendar, Users, Tag, AlertCircle } from 'lucide-react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { useModalAnimation } from '@/hooks/useModalAnimation';

const INITIAL_PROJECT_DATA = {
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  priority: 'medium',
  status: 'planning',
  team: [],
  tags: '',
};

export default function AddProjectModal({ isOpen, onClose, onSubmit }) {
  const [projectData, setProjectData] = useState(INITIAL_PROJECT_DATA);

  const { isClosing, handleClose, shouldRender } = useModalAnimation(isOpen, {
    delay: 400,
    onClose: useCallback(() => { onClose(); setProjectData(INITIAL_PROJECT_DATA); }, [onClose]),
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(projectData);
    handleClose();
  };

  if (!shouldRender) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-[100] transition-opacity duration-300 ${
          isClosing ? 'animate-fadeOut' : 'animate-fadeIn'
        }`}
        onClick={handleClose}
      ></div>

      {/* Slide-over Panel */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white shadow-2xl z-[101] transform transition-all duration-400 ease-out overflow-y-auto ${
        isClosing ? 'animate-slideOutRight' : 'animate-slideInRight'
      }`}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Add New Project</h2>
            <p className="text-sm text-gray-500">Create a new project and assign team members</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Project Name */}
          <Input
            label="Project Name"
            type="text"
            value={projectData.name}
            onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
            placeholder="Enter project name"
            required
          />

          {/* Description */}
          <Textarea
            label="Description"
            value={projectData.description}
            onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
            placeholder="Enter project description"
            rows={4}
          />

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              icon={Calendar}
              value={projectData.startDate}
              onChange={(e) => setProjectData({ ...projectData, startDate: e.target.value })}
              required
            />
            <Input
              label="End Date"
              type="date"
              icon={Calendar}
              value={projectData.endDate}
              onChange={(e) => setProjectData({ ...projectData, endDate: e.target.value })}
              required
            />
          </div>

          {/* Priority */}
          <Select
            label="Priority"
            icon={AlertCircle}
            value={projectData.priority}
            onChange={(e) => setProjectData({ ...projectData, priority: e.target.value })}
            required
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'critical', label: 'Critical' },
            ]}
          />

          {/* Status */}
          <Select
            label="Status"
            value={projectData.status}
            onChange={(e) => setProjectData({ ...projectData, status: e.target.value })}
            options={[
              { value: 'planning', label: 'Planning' },
              { value: 'in-progress', label: 'In Progress' },
              { value: 'on-hold', label: 'On Hold' },
              { value: 'completed', label: 'Completed' },
            ]}
          />

          {/* Team Members */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign Team Members
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={18} />
              <select
                multiple
                value={projectData.team}
                onChange={(e) => setProjectData({ 
                  ...projectData, 
                  team: Array.from(e.target.selectedOptions, option => option.value)
                })}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                size={4}
              >
                <option value="sarah">Sarah Johnson</option>
                <option value="mike">Mike Chen</option>
                <option value="emma">Emma Wilson</option>
                <option value="john">John Doe</option>
                <option value="alex">Alex Brown</option>
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple members</p>
          </div>

          {/* Tags */}
          <Input
            label="Tags"
            type="text"
            icon={Tag}
            value={projectData.tags}
            onChange={(e) => setProjectData({ ...projectData, tags: e.target.value })}
            placeholder="e.g. design, frontend, urgent"
            helperText="Separate tags with commas"
          />

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              type="submit"
              variant="primary"
              size="md"
              rounded="lg"
              fullWidth
            >
              Create Project
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="md"
              rounded="lg"
              fullWidth
              onClick={handleClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { X, Calendar, Users, AlertCircle, FileText } from 'lucide-react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { useModalAnimation } from '@/hooks/useModalAnimation';

export default function AddTaskModal({ isOpen, onClose, onSubmit }) {
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    project: '',
    priority: 'medium',
    status: 'todo',
    assignee: '',
    dueDate: '',
  });

  const resetTaskData = useCallback(() => {
    setTaskData({
      title: '',
      description: '',
      project: '',
      priority: 'medium',
      status: 'todo',
      assignee: '',
      dueDate: '',
    });
  }, []);

  const handleClose = useCallback(() => {
    resetTaskData();
  }, [resetTaskData]);

  const { isClosing, handleClose: animateClose, shouldRender } = useModalAnimation(isOpen, {
    delay: 400,
    onClose: useCallback(() => { onClose(); handleClose(); }, [onClose, handleClose]),
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
    onSubmit(taskData);
    animateClose();
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
            <h2 className="text-xl font-bold text-gray-800">Add New Task</h2>
            <p className="text-sm text-gray-500">Create a new task and assign it</p>
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
          {/* Task Title */}
          <Input
            label="Task Title"
            type="text"
            icon={FileText}
            value={taskData.title}
            onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
            placeholder="Enter task title"
            required
          />

          {/* Description */}
          <Textarea
            label="Description"
            value={taskData.description}
            onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
            placeholder="Enter task description"
            rows={4}
          />

          {/* Project */}
          <Select
            label="Project"
            value={taskData.project}
            onChange={(e) => setTaskData({ ...taskData, project: e.target.value })}
            required
            options={[
              { value: '', label: 'Select a project' },
              { value: 'website-redesign', label: 'Website Redesign' },
              { value: 'mobile-app', label: 'Mobile App Development' },
              { value: 'api-integration', label: 'API Integration' },
              { value: 'database-migration', label: 'Database Migration' },
            ]}
          />

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priority"
              icon={AlertCircle}
              value={taskData.priority}
              onChange={(e) => setTaskData({ ...taskData, priority: e.target.value })}
              required
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'critical', label: 'Critical' },
              ]}
            />
            <Select
              label="Status"
              value={taskData.status}
              onChange={(e) => setTaskData({ ...taskData, status: e.target.value })}
              options={[
                { value: 'todo', label: 'To Do' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
              ]}
            />
          </div>

          {/* Assignee */}
          <Select
            label="Assign To"
            icon={Users}
            value={taskData.assignee}
            onChange={(e) => setTaskData({ ...taskData, assignee: e.target.value })}
            required
            options={[
              { value: '', label: 'Select team member' },
              { value: 'sarah', label: 'Sarah Johnson' },
              { value: 'mike', label: 'Mike Chen' },
              { value: 'emma', label: 'Emma Wilson' },
              { value: 'john', label: 'John Doe' },
              { value: 'alex', label: 'Alex Brown' },
            ]}
          />

          {/* Due Date */}
          <Input
            label="Due Date"
            type="date"
            icon={Calendar}
            value={taskData.dueDate}
            onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })}
            required
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
              Create Task
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

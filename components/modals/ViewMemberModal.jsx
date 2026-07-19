import { X, Mail, Phone } from 'lucide-react';
import { useAppearance } from '@/contexts/AppearanceContext';
import { useModalAnimation } from '@/hooks/useModalAnimation';

export default function ViewMemberModal({ isOpen, onClose, member, onEdit }) {
  const { accentColor } = useAppearance();
  const { isClosing, handleClose, shouldRender } = useModalAnimation(isOpen, { delay: 300, onClose });

  if (!shouldRender || !member) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
          className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <div 
          className={`bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto transform transition-all duration-300 ease-out ${
            isClosing ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'
          }`}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Member Profile</h2>
            <button 
              onClick={handleClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Profile Header */}
            <div className="flex flex-col xs:flex-row items-center xs:items-start gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
              <div className="relative">
                <img 
                  src={member.avatar} 
                  alt={member.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
                <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
                  member.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
              </div>
              <div className="flex-1 text-center xs:text-left">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{member.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{member.role}</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                  member.status === 'active' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}>
                  {member.status === 'active' ? 'Active' : 'Away'}
                </span>
              </div>
            </div>

            {/* Contact Information */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 uppercase">Contact Information</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <Mail size={20} className="text-gray-400 dark:text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-sm text-gray-800 dark:text-gray-200 break-all">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <Phone size={20} className="text-gray-400 dark:text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                    <p className="text-sm text-gray-800 dark:text-gray-200">{member.phone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 uppercase">Statistics</h4>
              <div className="grid grid-cols-1 xs:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{member.projects}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Projects</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{member.tasks}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Tasks</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                  <p className="text-sm font-bold text-purple-600 dark:text-purple-400">{member.department}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Department</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col xs:flex-row gap-3">
              <button 
                onClick={() => {
                  handleClose();
                  setTimeout(() => onEdit(member), 300);
                }}
                className="flex-1 text-white py-2.5 rounded-lg font-medium hover:opacity-90 transition-all"
                style={{ backgroundColor: accentColor }}
              >
                Edit Member
              </button>
              <button 
                onClick={handleClose}
                className="xs:px-6 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

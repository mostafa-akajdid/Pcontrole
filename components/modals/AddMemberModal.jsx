import { useState, useEffect, useCallback } from 'react';
import { X, Mail, User, Briefcase } from 'lucide-react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { useModalAnimation } from '@/hooks/useModalAnimation';

const INITIAL_MEMBER = {
  name: '',
  email: '',
  role: '',
  department: 'engineering',
};

export default function AddMemberModal({ isOpen, onClose, onSubmit }) {
  const [memberData, setMemberData] = useState(INITIAL_MEMBER);

  const { isClosing, handleClose, shouldRender } = useModalAnimation(isOpen, {
    delay: 400,
    onClose: useCallback(() => { onClose(); setMemberData(INITIAL_MEMBER); }, [onClose]),
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
    onSubmit(memberData);
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
            <h2 className="text-xl font-bold text-gray-800">Add Team Member</h2>
            <p className="text-sm text-gray-500">Invite a new member to your team</p>
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
          {/* Name */}
          <Input
            label="Full Name"
            type="text"
            icon={User}
            value={memberData.name}
            onChange={(e) => setMemberData({ ...memberData, name: e.target.value })}
            placeholder="Enter full name"
            required
          />

          {/* Email */}
          <Input
            label="Email Address"
            type="email"
            icon={Mail}
            value={memberData.email}
            onChange={(e) => setMemberData({ ...memberData, email: e.target.value })}
            placeholder="Enter email address"
            required
            helperText="We'll send an invitation to this email"
          />

          {/* Role */}
          <Input
            label="Role/Position"
            type="text"
            icon={Briefcase}
            value={memberData.role}
            onChange={(e) => setMemberData({ ...memberData, role: e.target.value })}
            placeholder="e.g. Senior Developer"
            required
          />

          {/* Department */}
          <Select
            label="Department"
            value={memberData.department}
            onChange={(e) => setMemberData({ ...memberData, department: e.target.value })}
            options={[
              { value: 'engineering', label: 'Engineering' },
              { value: 'design', label: 'Design' },
              { value: 'product', label: 'Product' },
              { value: 'marketing', label: 'Marketing' },
              { value: 'sales', label: 'Sales' },
              { value: 'hr', label: 'Human Resources' },
            ]}
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
              Send Invitation
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

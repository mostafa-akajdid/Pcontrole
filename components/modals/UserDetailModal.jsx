import { useState, useEffect } from 'react';
import { X, Mail, Phone, Shield, Calendar, Clock, Key, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAppearance } from '@/contexts/AppearanceContext';

const STATUS_STYLES = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-600',
  SUSPENDED: 'bg-red-100 text-red-700',
};

export default function UserDetailModal({ isOpen, onClose, user, onEdit, onStatusChange, onResetPassword, onForcePasswordChange }) {
  const { accentColor } = useAppearance();
  const [isAnimating, setIsAnimating] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      setShowResetForm(false);
      setNewPassword('');
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => onClose(), 300);
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) return;
    await onResetPassword(user.id, newPassword);
    setShowResetForm(false);
    setNewPassword('');
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const formatDateTime = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <div className={`bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto transform transition-all duration-300 ease-out ${isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}>
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <h2 className="text-xl font-bold text-gray-800">User Profile</h2>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6 pb-6 border-b border-gray-100">
              <div className="relative">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-400">{user.name?.charAt(0)}</span>
                  </div>
                )}
                <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${user.status === 'ACTIVE' ? 'bg-green-500' : user.status === 'SUSPENDED' ? 'bg-red-500' : 'bg-gray-400'}`} />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-2xl font-bold text-gray-800">{user.name}</h3>
                <p className="text-gray-600">{user.email}</p>
                <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[user.status] || STATUS_STYLES.ACTIVE}`}>
                    {user.status}
                  </span>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {user.role?.name || 'No Role'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-800 mb-3 uppercase">Contact Information</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail size={20} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm text-gray-800 break-all">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone size={20} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm text-gray-800">{user.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Shield size={20} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Role</p>
                    <p className="text-sm text-gray-800">{user.role?.name || 'No Role'}</p>
                  </div>
                </div>
              </div>
            </div>

            {user.bio && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 uppercase">Bio</h4>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{user.bio}</p>
              </div>
            )}

            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-800 mb-3 uppercase">Account Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-500">Joined</span>
                  </div>
                  <p className="text-sm text-gray-800">{formatDate(user.createdAt)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-500">Last Login</span>
                  </div>
                  <p className="text-sm text-gray-800">{formatDateTime(user.lastLoginAt)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-500">Email Verified</span>
                  </div>
                  <p className="text-sm text-gray-800">{user.emailVerified ? 'Yes' : 'No'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Key size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-500">Force Password Change</span>
                  </div>
                  <p className="text-sm text-gray-800">{user.forcePasswordChange ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>

            {showResetForm && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Reset Password</span>
                </div>
                <p className="text-xs text-yellow-700 mb-3">Enter a new password for {user.name}.</p>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 8 characters)"
                  className="w-full px-3 py-2 border border-yellow-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 mb-2"
                />
                <div className="flex gap-2">
                  <button onClick={handleResetPassword} disabled={newPassword.length < 8} className="px-3 py-1.5 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 disabled:opacity-50">Confirm Reset</button>
                  <button onClick={() => { setShowResetForm(false); setNewPassword(''); }} className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300">Cancel</button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => { handleClose(); setTimeout(() => onEdit(user), 300); }} className="flex-1 text-white py-2.5 rounded-lg font-medium hover:opacity-90 transition-all" style={{ backgroundColor: accentColor }}>
                Edit User
              </button>
              <button onClick={() => setShowResetForm(!showResetForm)} className="flex-1 bg-yellow-100 text-yellow-700 py-2.5 rounded-lg font-medium hover:bg-yellow-200 transition-colors">
                Reset Password
              </button>
              <button onClick={() => onForcePasswordChange(user.id, !user.forcePasswordChange)} className="flex-1 bg-orange-100 text-orange-700 py-2.5 rounded-lg font-medium hover:bg-orange-200 transition-colors">
                {user.forcePasswordChange ? 'Cancel Force Change' : 'Force Password Change'}
              </button>
              <button onClick={handleClose} className="sm:px-6 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

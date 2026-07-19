import { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Phone, Shield } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import MediaPicker from '@/components/modals/MediaPicker';
import { useAppearance } from '@/contexts/AppearanceContext';

export default function UserFormModal({ isOpen, onClose, onSubmit, user = null, roles = [] }) {
  const { accentColor } = useAppearance();
  const [isClosing, setIsClosing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    roleId: '',
    phone: '',
    bio: '',
    avatar: '',
  });

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      document.body.style.overflow = 'hidden';

      if (user) {
        setFormData({
          name: user.name || '',
          email: user.email || '',
          password: '',
          confirmPassword: '',
          roleId: user.roleId || '',
          phone: user.phone || '',
          bio: user.bio || '',
          avatar: user.avatar || '',
        });
      } else {
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          roleId: roles.length > 0 ? roles[0].id : '',
          phone: '',
          bio: '',
          avatar: '',
        });
      }
      setErrors({});
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, user?.id, roles.length]);

  const validate = () => {
    const newErrors = {};

    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!user && (!formData.password || formData.password.length < 8)) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!user && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (user && formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (user && formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.roleId) {
      newErrors.roleId = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        phone: formData.phone || undefined,
        bio: formData.bio || undefined,
        avatar: formData.avatar || undefined,
      };
      if (user && !submitData.password) {
        delete submitData.password;
        delete submitData.confirmPassword;
      }
      delete submitData.confirmPassword;

      await onSubmit(submitData);
      handleClose();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setFormData({ name: '', email: '', password: '', confirmPassword: '', roleId: '', phone: '', bio: '', avatar: '' });
      setErrors({});
    }, 300);
  };

  const handleAvatarSelect = (media) => {
    if (media && media.length > 0) {
      setFormData({ ...formData, avatar: media[0].secureUrl || media[0].url });
    }
    setShowMediaPicker(false);
  };

  if (!isOpen && !isClosing) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-[100] transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleClose}
      />

      <div className={`fixed inset-y-0 right-0 w-full sm:w-[520px] bg-white shadow-2xl z-[101] transform transition-all duration-300 ease-out overflow-y-auto ${isClosing ? 'translate-x-full' : 'translate-x-0'}`}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{user ? 'Edit User' : 'Create User'}</h2>
            <p className="text-sm text-gray-500">{user ? 'Update user information' : 'Add a new user to the system'}</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{errors.submit}</div>
          )}

          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-offset-2 transition-all"
              style={{ '--tw-ring-color': accentColor }}
              onClick={() => setShowMediaPicker(true)}
            >
              {formData.avatar ? (
                <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={32} className="text-gray-400" />
              )}
            </div>
            <div>
              <button type="button" onClick={() => setShowMediaPicker(true)} className="text-sm font-medium hover:underline" style={{ color: accentColor }}>Change Photo</button>
              <p className="text-xs text-gray-500 mt-0.5">JPG, PNG or GIF</p>
            </div>
          </div>

          <Input
            label="Full Name"
            icon={User}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            placeholder="Enter full name"
            required
          />

          <Input
            label="Email Address"
            type="email"
            icon={Mail}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
            placeholder="Enter email address"
            required
          />

          <Input
            label={user ? 'New Password (leave blank to keep current)' : 'Password'}
            type="password"
            icon={Lock}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={errors.password}
            placeholder={user ? 'Enter new password' : 'Enter password'}
            required={!user}
          />

          <Input
            label="Confirm Password"
            type="password"
            icon={Lock}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            error={errors.confirmPassword}
            placeholder="Confirm password"
            required={!user || !!formData.password}
          />

          <Select
            label="Role"
            icon={Shield}
            value={formData.roleId}
            onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
            error={errors.roleId}
            options={roles.map((r) => ({ value: r.id, label: r.name }))}
            required
          />

          <Input
            label="Phone Number"
            icon={Phone}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Enter phone number"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about this user..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-white text-gray-800 text-sm resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button type="submit" variant="primary" size="md" rounded="lg" fullWidth disabled={loading}>
              {loading ? 'Saving...' : user ? 'Update User' : 'Create User'}
            </Button>
            <Button type="button" variant="secondary" size="md" rounded="lg" fullWidth onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>

      {showMediaPicker && (
        <MediaPicker
          isOpen={showMediaPicker}
          onClose={() => setShowMediaPicker(false)}
          onSelect={handleAvatarSelect}
          mode="single"
        />
      )}
    </>
  );
}

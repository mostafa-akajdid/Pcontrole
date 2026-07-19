import { useState } from 'react';
import { Lock, Save } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useToast } from '@/contexts/ToastContext';

export default function PasswordSettings() {
  const toast = useToast();
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/settings/profile?type=password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Password changed successfully');
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(result.message || 'Failed to change password');
      }
    } catch {
      toast.error('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card padding="none">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Lock size={20} className="text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Change Password</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Update your account password</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <Input label="Current Password" type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} required />
        <Input label="New Password" type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} helperText="Minimum 8 characters with uppercase, lowercase, and number" required />
        <Input label="Confirm New Password" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
      </div>

      <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
        <Button onClick={handleSave} loading={saving} icon={Save}>Update Password</Button>
      </div>
    </Card>
  );
}

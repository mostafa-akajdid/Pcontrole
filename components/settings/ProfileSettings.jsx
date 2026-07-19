import { useState, useEffect } from 'react';
import { User, Save } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import MediaPicker from '@/components/modals/MediaPicker';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

export default function ProfileSettings() {
  const { user, fetchUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    avatar: '',
  });
  const [saving, setSaving] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        phone: form.phone || undefined,
        bio: form.bio || undefined,
        avatar: form.avatar || undefined,
      };
      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Profile updated');
        fetchUser();
      } else {
        toast.error(result.message || 'Failed to update profile');
      }
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card padding="none">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <User size={20} className="text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Profile Information</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage your personal information</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="flex items-center gap-6">
          <div className="relative">
            <img src={form.avatar || 'https://i.pravatar.cc/150?u=default'} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
          </div>
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">Profile Photo</p>
            <p className="text-sm text-gray-500 mb-2">PNG, JPG up to 5MB</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setShowAvatarPicker(true)}>Choose Photo</Button>
              {form.avatar && <Button size="sm" variant="ghost" onClick={() => setForm({ ...form, avatar: '' })}>Remove</Button>}
            </div>
            <MediaPicker isOpen={showAvatarPicker} onClose={() => setShowAvatarPicker(false)} onSelect={(sel) => { if (sel?.[0]) setForm({ ...form, avatar: sel[0].url || sel[0].secureUrl }); setShowAvatarPicker(false); }} mode="single" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 8900" />
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</label>
          <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent resize-none" placeholder="Tell us about yourself" />
        </div>
      </div>

      <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
        <Button onClick={handleSave} loading={saving} icon={Save}>Save Profile</Button>
      </div>
    </Card>
  );
}

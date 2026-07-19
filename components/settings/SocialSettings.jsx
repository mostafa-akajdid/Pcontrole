import { useState, useEffect } from 'react';
import { Share2 } from 'lucide-react';
import Input from '@/components/ui/Input';
import SettingsSection from './SettingsSection';
import { useToast } from '@/contexts/ToastContext';

const SOCIAL_FIELDS = [
  { key: 'facebookUrl', label: 'Facebook', placeholder: 'https://facebook.com/yourpage' },
  { key: 'twitterUrl', label: 'X (Twitter)', placeholder: 'https://x.com/yourhandle' },
  { key: 'instagramUrl', label: 'Instagram', placeholder: 'https://instagram.com/yourprofile' },
  { key: 'linkedinUrl', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourcompany' },
  { key: 'youtubeUrl', label: 'YouTube', placeholder: 'https://youtube.com/yourchannel' },
];

export default function SocialSettings({ data, onSave }) {
  const toast = useToast();
  const [form, setForm] = useState({
    facebookUrl: '',
    twitterUrl: '',
    instagramUrl: '',
    linkedinUrl: '',
    youtubeUrl: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.settings) {
      setForm({
        facebookUrl: data.settings.facebookUrl || '',
        twitterUrl: data.settings.twitterUrl || '',
        instagramUrl: data.settings.instagramUrl || '',
        linkedinUrl: data.settings.linkedinUrl || '',
        youtubeUrl: data.settings.youtubeUrl || '',
      });
    }
  }, [data]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const settings = Object.entries(form).map(([key, value]) => ({ key, value }));
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, group: 'social' }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Social media settings saved');
        onSave?.();
      } else {
        toast.error(result.message || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsSection title="Social Media" description="Social media profile links" icon={Share2} onSave={handleSave} loading={saving}>
      <div className="space-y-5">
        {SOCIAL_FIELDS.map((field) => (
          <Input key={field.key} label={field.label} value={form[field.key]} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} placeholder={field.placeholder} />
        ))}
      </div>
    </SettingsSection>
  );
}

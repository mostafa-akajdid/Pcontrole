import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import Input from '@/components/ui/Input';
import MediaPicker from '@/components/modals/MediaPicker';
import Button from '@/components/ui/Button';
import { Image as ImageIcon } from 'lucide-react';
import SettingsSection from './SettingsSection';
import { useToast } from '@/contexts/ToastContext';

export default function SeoSettings({ data, onSave }) {
  const toast = useToast();
  const [form, setForm] = useState({
    defaultSeoTitle: '',
    defaultSeoDescription: '',
    defaultOgImage: '',
    robots: 'index, follow',
    canonicalBaseUrl: '',
    googleAnalyticsId: '',
  });
  const [saving, setSaving] = useState(false);
  const [showOgPicker, setShowOgPicker] = useState(false);

  useEffect(() => {
    if (data?.settings) {
      setForm({
        defaultSeoTitle: data.settings.defaultSeoTitle || '',
        defaultSeoDescription: data.settings.defaultSeoDescription || '',
        defaultOgImage: data.settings.defaultOgImage || '',
        robots: data.settings.robots || 'index, follow',
        canonicalBaseUrl: data.settings.canonicalBaseUrl || '',
        googleAnalyticsId: data.settings.googleAnalyticsId || '',
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
        body: JSON.stringify({ settings, group: 'seo' }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('SEO settings saved');
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
    <SettingsSection title="SEO Defaults" description="Search engine optimization settings" icon={Search} onSave={handleSave} loading={saving}>
      <div className="space-y-5">
        <Input label="Default Meta Title" value={form.defaultSeoTitle} onChange={(e) => setForm({ ...form, defaultSeoTitle: e.target.value })} placeholder="My Site - Home Page" />
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Meta Description</label>
          <textarea value={form.defaultSeoDescription} onChange={(e) => setForm({ ...form, defaultSeoDescription: e.target.value })} rows={3} className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent resize-none" placeholder="A brief description for search engines" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default OG Image</label>
          <div className="flex items-center gap-3">
            <div className="w-20 h-16 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800">
              {form.defaultOgImage ? <img src={form.defaultOgImage} alt="OG" className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-gray-400" />}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setShowOgPicker(true)}>Choose Image</Button>
              {form.defaultOgImage && <Button size="sm" variant="ghost" onClick={() => setForm({ ...form, defaultOgImage: '' })}>Remove</Button>}
            </div>
            <MediaPicker isOpen={showOgPicker} onClose={() => setShowOgPicker(false)} onSelect={(sel) => { if (sel?.[0]) setForm({ ...form, defaultOgImage: sel[0].url || sel[0].secureUrl }); setShowOgPicker(false); }} mode="single" />
          </div>
        </div>
        <Input label="Robots Directive" value={form.robots} onChange={(e) => setForm({ ...form, robots: e.target.value })} placeholder="index, follow" helperText="Controls search engine indexing behavior" />
        <Input label="Canonical Base URL" value={form.canonicalBaseUrl} onChange={(e) => setForm({ ...form, canonicalBaseUrl: e.target.value })} placeholder="https://example.com" helperText="Base URL for canonical links" />
        <Input label="Google Analytics ID" value={form.googleAnalyticsId} onChange={(e) => setForm({ ...form, googleAnalyticsId: e.target.value })} placeholder="G-XXXXXXXXXX" />
      </div>
    </SettingsSection>
  );
}

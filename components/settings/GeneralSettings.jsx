import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import SettingsSection from './SettingsSection';
import { useToast } from '@/contexts/ToastContext';
import { LANGUAGE_OPTIONS, TIMEZONE_OPTIONS } from '@/lib/utils';

const DATE_FORMAT_OPTIONS = [
  { value: 'MMM d, yyyy', label: 'Jan 1, 2026' },
  { value: 'MM/dd/yyyy', label: '01/01/2026' },
  { value: 'dd/MM/yyyy', label: '01/01/2026 (DD/MM)' },
  { value: 'yyyy-MM-dd', label: '2026-01-01' },
  { value: 'd MMMM yyyy', label: '1 January 2026' },
];

const TIME_FORMAT_OPTIONS = [
  { value: 'hh:mm a', label: '12:00 PM' },
  { value: 'HH:mm', label: '12:00' },
  { value: 'HH:mm:ss', label: '12:00:00' },
];

export default function GeneralSettings({ data, onSave }) {
  const toast = useToast();
  const [form, setForm] = useState({
    siteName: '',
    siteDescription: '',
    defaultLanguage: 'en',
    timezone: 'UTC',
    dateFormat: 'MMM d, yyyy',
    timeFormat: 'hh:mm a',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.settings) {
      setForm({
        siteName: data.settings.siteName || '',
        siteDescription: data.settings.siteDescription || '',
        defaultLanguage: data.settings.defaultLanguage || 'en',
        timezone: data.settings.timezone || 'UTC',
        dateFormat: data.settings.dateFormat || 'MMM d, yyyy',
        timeFormat: data.settings.timeFormat || 'hh:mm a',
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
        body: JSON.stringify({ settings, group: 'general' }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('General settings saved');
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
    <SettingsSection
      title="General Settings"
      description="Basic site configuration"
      icon={Globe}
      onSave={handleSave}
      loading={saving}
    >
      <div className="space-y-5">
        <Input
          label="Site Name"
          value={form.siteName}
          onChange={(e) => setForm({ ...form, siteName: e.target.value })}
          placeholder="My Website"
          required
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Site Description</label>
          <textarea
            value={form.siteDescription}
            onChange={(e) => setForm({ ...form, siteDescription: e.target.value })}
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            placeholder="A brief description of your site"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Select
            label="Default Language"
            value={form.defaultLanguage}
            onChange={(e) => setForm({ ...form, defaultLanguage: e.target.value })}
            options={LANGUAGE_OPTIONS}
          />
          <Select
            label="Timezone"
            value={form.timezone}
            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            options={TIMEZONE_OPTIONS}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Select
            label="Date Format"
            value={form.dateFormat}
            onChange={(e) => setForm({ ...form, dateFormat: e.target.value })}
            options={DATE_FORMAT_OPTIONS}
          />
          <Select
            label="Time Format"
            value={form.timeFormat}
            onChange={(e) => setForm({ ...form, timeFormat: e.target.value })}
            options={TIME_FORMAT_OPTIONS}
          />
        </div>
      </div>
    </SettingsSection>
  );
}

import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import Select from '@/components/ui/Select';
import SettingsSection from './SettingsSection';
import { useToast } from '@/contexts/ToastContext';
import { LANGUAGE_OPTIONS, TIMEZONE_OPTIONS } from '@/lib/utils';

const FIRST_DAY_OPTIONS = [
  { value: 'sunday', label: 'Sunday' },
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
];

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'IDR', label: 'IDR - Indonesian Rupiah' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
];

export default function LocalizationSettings({ data, onSave }) {
  const toast = useToast();
  const [form, setForm] = useState({
    localizationLanguage: 'en',
    localizationTimezone: 'UTC',
    firstDayOfWeek: 'monday',
    defaultCurrency: 'USD',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.settings) {
      setForm({
        localizationLanguage: data.settings.localizationLanguage || 'en',
        localizationTimezone: data.settings.localizationTimezone || 'UTC',
        firstDayOfWeek: data.settings.firstDayOfWeek || 'monday',
        defaultCurrency: data.settings.defaultCurrency || 'USD',
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
        body: JSON.stringify({ settings, group: 'localization' }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Localization settings saved');
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
    <SettingsSection title="Localization" description="Language, timezone, and regional settings" icon={MapPin} onSave={handleSave} loading={saving}>
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Select label="Language" value={form.localizationLanguage} onChange={(e) => setForm({ ...form, localizationLanguage: e.target.value })} options={LANGUAGE_OPTIONS} />
          <Select label="Timezone" value={form.localizationTimezone} onChange={(e) => setForm({ ...form, localizationTimezone: e.target.value })} options={TIMEZONE_OPTIONS} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Select label="First Day of Week" value={form.firstDayOfWeek} onChange={(e) => setForm({ ...form, firstDayOfWeek: e.target.value })} options={FIRST_DAY_OPTIONS} />
          <Select label="Default Currency" value={form.defaultCurrency} onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value })} options={CURRENCY_OPTIONS} />
        </div>
      </div>
    </SettingsSection>
  );
}

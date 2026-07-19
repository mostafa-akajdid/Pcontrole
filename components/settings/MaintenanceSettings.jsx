import { useState, useEffect } from 'react';
import { Wrench } from 'lucide-react';
import Input from '@/components/ui/Input';
import Toggle from './Toggle';
import SettingsSection from './SettingsSection';
import { useToast } from '@/contexts/ToastContext';

export default function MaintenanceSettings({ data, onSave }) {
  const toast = useToast();
  const [form, setForm] = useState({
    maintenanceMode: false,
    maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back later.',
    maintenanceReturnDate: '',
    maintenanceAllowAdmin: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.settings) {
      setForm({
        maintenanceMode: data.settings.maintenanceMode === 'true',
        maintenanceMessage: data.settings.maintenanceMessage || '',
        maintenanceReturnDate: data.settings.maintenanceReturnDate || '',
        maintenanceAllowAdmin: data.settings.maintenanceAllowAdmin !== 'false',
      });
    }
  }, [data]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const settings = [
        { key: 'maintenanceMode', value: String(form.maintenanceMode) },
        { key: 'maintenanceMessage', value: form.maintenanceMessage },
        { key: 'maintenanceReturnDate', value: form.maintenanceReturnDate },
        { key: 'maintenanceAllowAdmin', value: String(form.maintenanceAllowAdmin) },
      ];
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, group: 'maintenance' }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Maintenance settings saved');
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
    <SettingsSection title="Maintenance Mode" description="Control site maintenance mode" icon={Wrench} onSave={handleSave} loading={saving}>
      <div className="space-y-6">
        {form.maintenanceMode && (
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
              Maintenance mode is currently ACTIVE. Non-admin users will see the maintenance message.
            </p>
          </div>
        )}

        <Toggle label="Enable Maintenance Mode" description="When enabled, non-admin users will see the maintenance page" checked={form.maintenanceMode} onChange={(v) => setForm({ ...form, maintenanceMode: v })} />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Maintenance Message</label>
          <textarea value={form.maintenanceMessage} onChange={(e) => setForm({ ...form, maintenanceMessage: e.target.value })} rows={4} className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent resize-none" placeholder="Message shown to users during maintenance" />
        </div>

        <Input label="Expected Return Date" type="datetime-local" value={form.maintenanceReturnDate} onChange={(e) => setForm({ ...form, maintenanceReturnDate: e.target.value })} helperText="Optional - helps users know when to come back" />

        <Toggle label="Allow Admin Access" description="Admins can access the site even during maintenance" checked={form.maintenanceAllowAdmin} onChange={(v) => setForm({ ...form, maintenanceAllowAdmin: v })} />
      </div>
    </SettingsSection>
  );
}

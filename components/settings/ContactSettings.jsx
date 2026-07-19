import { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';
import Input from '@/components/ui/Input';
import SettingsSection from './SettingsSection';
import { useToast } from '@/contexts/ToastContext';

export default function ContactSettings({ data, onSave }) {
  const toast = useToast();
  const [form, setForm] = useState({
    companyName: '',
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
    googleMapsLink: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.settings) {
      setForm({
        companyName: data.settings.companyName || '',
        contactEmail: data.settings.contactEmail || '',
        contactPhone: data.settings.contactPhone || '',
        contactAddress: data.settings.contactAddress || '',
        googleMapsLink: data.settings.googleMapsLink || '',
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
        body: JSON.stringify({ settings, group: 'contact' }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Contact settings saved');
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
    <SettingsSection title="Contact Information" description="Company and contact details" icon={Mail} onSave={handleSave} loading={saving}>
      <div className="space-y-5">
        <Input label="Company Name" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="Your Company Name" />
        <Input label="Email" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} placeholder="contact@example.com" />
        <Input label="Phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="+1 234 567 8900" />
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</label>
          <textarea value={form.contactAddress} onChange={(e) => setForm({ ...form, contactAddress: e.target.value })} rows={3} className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent resize-none" placeholder="123 Main St, City, Country" />
        </div>
        <Input label="Google Maps Link" value={form.googleMapsLink} onChange={(e) => setForm({ ...form, googleMapsLink: e.target.value })} placeholder="https://maps.google.com/..." />
      </div>
    </SettingsSection>
  );
}

import { useState, useEffect } from 'react';
import { Palette, Image as ImageIcon } from 'lucide-react';
import Button from '@/components/ui/Button';
import MediaPicker from '@/components/modals/MediaPicker';
import SettingsSection from './SettingsSection';
import { useToast } from '@/contexts/ToastContext';

const IMAGE_FIELDS = [
  { key: 'siteLogo', label: 'Site Logo', description: 'Displayed in the header and browser tab' },
  { key: 'siteFavicon', label: 'Favicon', description: 'Small icon in the browser tab' },
  { key: 'adminLogo', label: 'Admin Logo', description: 'Logo in the admin sidebar' },
  { key: 'defaultPlaceholderImage', label: 'Default Placeholder', description: 'Fallback image when none is set' },
];

function ImageField({ label, description, value, onChange }) {
  const [showPicker, setShowPicker] = useState(false);

  const handleSelect = (selected) => {
    if (selected && selected.length > 0) {
      onChange(selected[0].url || selected[0].secureUrl);
    }
    setShowPicker(false);
  };

  return (
    <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800">
        {value ? (
          <img src={value} alt={label} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon size={24} className="text-gray-400" />
        )}
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-800 dark:text-gray-200">{label}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{description}</p>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowPicker(true)}>
            Choose from Media
          </Button>
          {value && (
            <Button size="sm" variant="ghost" onClick={() => onChange('')}>
              Remove
            </Button>
          )}
        </div>
      </div>
      <MediaPicker isOpen={showPicker} onClose={() => setShowPicker(false)} onSelect={handleSelect} mode="single" />
    </div>
  );
}

export default function BrandingSettings({ data, onSave }) {
  const toast = useToast();
  const [form, setForm] = useState({
    siteLogo: '',
    siteFavicon: '',
    adminLogo: '',
    defaultPlaceholderImage: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.settings) {
      setForm({
        siteLogo: data.settings.siteLogo || '',
        siteFavicon: data.settings.siteFavicon || '',
        adminLogo: data.settings.adminLogo || '',
        defaultPlaceholderImage: data.settings.defaultPlaceholderImage || '',
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
        body: JSON.stringify({ settings, group: 'branding' }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Branding settings saved');
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
      title="Branding"
      description="Logo, favicon, and visual identity"
      icon={Palette}
      onSave={handleSave}
      loading={saving}
    >
      <div className="space-y-4">
        {IMAGE_FIELDS.map((field) => (
          <ImageField
            key={field.key}
            label={field.label}
            description={field.description}
            value={form[field.key]}
            onChange={(value) => setForm({ ...form, [field.key]: value })}
          />
        ))}
      </div>
    </SettingsSection>
  );
}

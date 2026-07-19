import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import Input from '@/components/ui/Input';
import Toggle from './Toggle';
import SettingsSection from './SettingsSection';
import { useToast } from '@/contexts/ToastContext';

export default function SecuritySettings({ data, onSave }) {
  const toast = useToast();
  const [form, setForm] = useState({
    sessionTimeout: '60',
    maxLoginAttempts: '5',
    passwordMinLength: '8',
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumber: true,
    allowRegistration: false,
    emailVerificationRequired: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.settings) {
      setForm({
        sessionTimeout: data.settings.sessionTimeout || '60',
        maxLoginAttempts: data.settings.maxLoginAttempts || '5',
        passwordMinLength: data.settings.passwordMinLength || '8',
        passwordRequireUppercase: data.settings.passwordRequireUppercase === 'true',
        passwordRequireLowercase: data.settings.passwordRequireLowercase === 'true',
        passwordRequireNumber: data.settings.passwordRequireNumber === 'true',
        allowRegistration: data.settings.allowRegistration === 'true',
        emailVerificationRequired: data.settings.emailVerificationRequired === 'true',
      });
    }
  }, [data]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const settings = [
        { key: 'sessionTimeout', value: form.sessionTimeout },
        { key: 'maxLoginAttempts', value: form.maxLoginAttempts },
        { key: 'passwordMinLength', value: form.passwordMinLength },
        { key: 'passwordRequireUppercase', value: String(form.passwordRequireUppercase) },
        { key: 'passwordRequireLowercase', value: String(form.passwordRequireLowercase) },
        { key: 'passwordRequireNumber', value: String(form.passwordRequireNumber) },
        { key: 'allowRegistration', value: String(form.allowRegistration) },
        { key: 'emailVerificationRequired', value: String(form.emailVerificationRequired) },
      ];
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, group: 'security' }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Security settings saved');
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
    <SettingsSection title="Security" description="Authentication and security policies" icon={Shield} onSave={handleSave} loading={saving}>
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Session & Login</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="Session Timeout (minutes)" value={form.sessionTimeout} onChange={(e) => setForm({ ...form, sessionTimeout: e.target.value })} type="number" min="5" max="1440" />
            <Input label="Max Login Attempts" value={form.maxLoginAttempts} onChange={(e) => setForm({ ...form, maxLoginAttempts: e.target.value })} type="number" min="1" max="20" />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Password Policy</h4>
          <div className="space-y-3">
            <Input label="Minimum Password Length" value={form.passwordMinLength} onChange={(e) => setForm({ ...form, passwordMinLength: e.target.value })} type="number" min="6" max="32" />
            <Toggle label="Require Uppercase Letters" checked={form.passwordRequireUppercase} onChange={(v) => setForm({ ...form, passwordRequireUppercase: v })} />
            <Toggle label="Require Lowercase Letters" checked={form.passwordRequireLowercase} onChange={(v) => setForm({ ...form, passwordRequireLowercase: v })} />
            <Toggle label="Require Numbers" checked={form.passwordRequireNumber} onChange={(v) => setForm({ ...form, passwordRequireNumber: v })} />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Registration</h4>
          <div className="space-y-3">
            <Toggle label="Allow Public Registration" description="Allow new users to register without invitation" checked={form.allowRegistration} onChange={(v) => setForm({ ...form, allowRegistration: v })} />
            <Toggle label="Require Email Verification" description="Users must verify their email before accessing the system" checked={form.emailVerificationRequired} onChange={(v) => setForm({ ...form, emailVerificationRequired: v })} />
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}

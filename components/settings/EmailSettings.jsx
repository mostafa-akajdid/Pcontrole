import { useState, useEffect } from 'react';
import { Send, TestTube } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import SettingsSection from './SettingsSection';
import { useToast } from '@/contexts/ToastContext';

export default function EmailSettings({ data, onSave }) {
  const toast = useToast();
  const [form, setForm] = useState({
    smtpHost: '',
    smtpPort: '587',
    smtpUsername: '',
    smtpPassword: '',
    smtpSenderName: '',
    smtpSenderEmail: '',
  });
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (data?.settings) {
      setForm({
        smtpHost: data.settings.smtpHost || '',
        smtpPort: data.settings.smtpPort || '587',
        smtpUsername: data.settings.smtpUsername || '',
        smtpPassword: data.settings.smtpPassword || '',
        smtpSenderName: data.settings.smtpSenderName || '',
        smtpSenderEmail: data.settings.smtpSenderEmail || '',
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
        body: JSON.stringify({ settings, group: 'email' }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Email settings saved');
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

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.warning('Enter a test email address');
      return;
    }
    setTesting(true);
    try {
      const response = await fetch('/api/settings/smtp-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: testEmail }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Test email sent successfully');
      } else {
        toast.error(result.message || 'Failed to send test email');
      }
    } catch {
      toast.error('Failed to send test email');
    } finally {
      setTesting(false);
    }
  };

  return (
    <SettingsSection title="Email Configuration" description="SMTP settings for outgoing emails" icon={Send} onSave={handleSave} loading={saving}>
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="SMTP Host" value={form.smtpHost} onChange={(e) => setForm({ ...form, smtpHost: e.target.value })} placeholder="smtp.gmail.com" />
          <Input label="SMTP Port" value={form.smtpPort} onChange={(e) => setForm({ ...form, smtpPort: e.target.value })} placeholder="587" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="Username" value={form.smtpUsername} onChange={(e) => setForm({ ...form, smtpUsername: e.target.value })} placeholder="your@email.com" />
          <Input label="Password" type="password" value={form.smtpPassword} onChange={(e) => setForm({ ...form, smtpPassword: e.target.value })} placeholder="••••••••" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="Sender Name" value={form.smtpSenderName} onChange={(e) => setForm({ ...form, smtpSenderName: e.target.value })} placeholder="PIOLEC" />
          <Input label="Sender Email" type="email" value={form.smtpSenderEmail} onChange={(e) => setForm({ ...form, smtpSenderEmail: e.target.value })} placeholder="noreply@example.com" />
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Test Email Configuration</h4>
          <div className="flex gap-3">
            <Input containerClassName="flex-1" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="test@example.com" />
            <Button variant="secondary" icon={TestTube} onClick={handleTestEmail} loading={testing}>
              Send Test
            </Button>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}

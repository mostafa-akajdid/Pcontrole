import { useState, useEffect, useCallback } from 'react';
import {
  Globe, Palette, Search, Mail, Share2, Send, MapPin, Shield,
  Wrench, Server, User, Lock, Settings as SettingsIcon,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useAppearance } from '@/contexts/AppearanceContext';
import GeneralSettings from '@/components/settings/GeneralSettings';
import BrandingSettings from '@/components/settings/BrandingSettings';
import SeoSettings from '@/components/settings/SeoSettings';
import ContactSettings from '@/components/settings/ContactSettings';
import SocialSettings from '@/components/settings/SocialSettings';
import EmailSettings from '@/components/settings/EmailSettings';
import LocalizationSettings from '@/components/settings/LocalizationSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';
import MaintenanceSettings from '@/components/settings/MaintenanceSettings';
import SystemInfo from '@/components/settings/SystemInfo';
import ProfileSettings from '@/components/settings/ProfileSettings';
import PasswordSettings from '@/components/settings/PasswordSettings';

const PERSONAL_TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'password', label: 'Password', icon: Lock },
];

const SYSTEM_TABS = [
  { id: 'general', label: 'General', icon: Globe },
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'seo', label: 'SEO', icon: Search },
  { id: 'contact', label: 'Contact', icon: Mail },
  { id: 'social', label: 'Social Media', icon: Share2 },
  { id: 'email', label: 'Email (SMTP)', icon: Send },
  { id: 'localization', label: 'Localization', icon: MapPin },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  { id: 'system', label: 'System Info', icon: Server },
];

export default function SettingsPage() {
  const { hasPermission } = useAuth();
  const { accentColor } = useAppearance();
  const [activeTab, setActiveTab] = useState('profile');
  const [settingsData, setSettingsData] = useState({});
  const [loading, setLoading] = useState(true);

  const canUpdateSettings = hasPermission('settings.update');
  const canViewSystemInfo = hasPermission('settings.system-info');
  const canViewMaintenance = hasPermission('settings.maintenance');

  const fetchSettings = useCallback(async (group) => {
    try {
      const response = await fetch(`/api/settings?group=${group}`);
      const result = await response.json();
      if (result.success) {
        setSettingsData((prev) => ({ ...prev, [group]: result.data }));
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
  }, []);

  useEffect(() => {
    const loadAllSettings = async () => {
      setLoading(true);
      const groups = ['general', 'branding', 'seo', 'contact', 'social', 'email', 'localization', 'security', 'maintenance'];
      await Promise.all(groups.map((g) => fetchSettings(g)));
      setLoading(false);
    };
    loadAllSettings();
  }, [fetchSettings]);

  const visibleSystemTabs = SYSTEM_TABS.filter((tab) => {
    if (tab.id === 'system') return canViewSystemInfo;
    if (tab.id === 'maintenance') return canViewMaintenance;
    if (!canUpdateSettings && tab.id !== 'system' && tab.id !== 'maintenance') return false;
    return true;
  });

  const allTabs = [
    ...PERSONAL_TABS,
    ...(visibleSystemTabs.length > 0 ? [{ divider: true, label: 'SYSTEM' }] : []),
    ...visibleSystemTabs,
  ];

  return (
    <DashboardLayout title="Settings - TASKILY" description="System configuration center">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">Settings</h1>
        <p className="text-gray-500 text-sm">Manage your account and system configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-4 border border-gray-100 sticky top-8">
            <nav className="space-y-1">
              {allTabs.map((tab, index) => {
                if (tab.divider) {
                  return (
                    <p key={index} className="text-xs font-semibold text-gray-400 dark:text-gray-500 mt-4 mb-2 px-4">
                      {tab.label}
                    </p>
                  );
                }
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    style={activeTab === tab.id ? { backgroundColor: accentColor } : {}}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'password' && <PasswordSettings />}
          {activeTab === 'general' && <GeneralSettings data={settingsData.general} onSave={() => fetchSettings('general')} />}
          {activeTab === 'branding' && <BrandingSettings data={settingsData.branding} onSave={() => fetchSettings('branding')} />}
          {activeTab === 'seo' && <SeoSettings data={settingsData.seo} onSave={() => fetchSettings('seo')} />}
          {activeTab === 'contact' && <ContactSettings data={settingsData.contact} onSave={() => fetchSettings('contact')} />}
          {activeTab === 'social' && <SocialSettings data={settingsData.social} onSave={() => fetchSettings('social')} />}
          {activeTab === 'email' && <EmailSettings data={settingsData.email} onSave={() => fetchSettings('email')} />}
          {activeTab === 'localization' && <LocalizationSettings data={settingsData.localization} onSave={() => fetchSettings('localization')} />}
          {activeTab === 'security' && <SecuritySettings data={settingsData.security} onSave={() => fetchSettings('security')} />}
          {activeTab === 'maintenance' && <MaintenanceSettings data={settingsData.maintenance} onSave={() => fetchSettings('maintenance')} />}
          {activeTab === 'system' && <SystemInfo />}
        </div>
      </div>
    </DashboardLayout>
  );
}

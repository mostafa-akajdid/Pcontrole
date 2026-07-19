import { useState, useEffect, useCallback } from 'react';
import { Key, Globe, Plus, Trash2, RefreshCw, Copy, Eye, EyeOff, Check, X } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Toggle from './Toggle';
import SettingsSection from './SettingsSection';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/contexts/ToastContext';
import { useAppearance } from '@/contexts/AppearanceContext';
import { usePermission } from '@/hooks/usePermission';

const AVAILABLE_MODULES = [
  { id: 'projects', label: 'Projects' },
  { id: 'blogs', label: 'Blogs' },
  { id: 'categories', label: 'Categories' },
  { id: 'media', label: 'Media' },
  { id: 'settings', label: 'Settings' },
];

const INITIAL_FORM = {
  siteName: '',
  domain: '',
  enabled: true,
  allowedModules: ['projects'],
};

export default function HeadlessApiSettings() {
  const toast = useToast();
  const { accentColor } = useAppearance();
  const { can } = usePermission();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [regenerating, setRegenerating] = useState(null);
  const [visibleKeys, setVisibleKeys] = useState({});
  const [copied, setCopied] = useState(null);

  const canCreate = can('headless.create');
  const canUpdate = can('headless.update');
  const canDelete = can('headless.delete');
  const canRegenerate = can('headless.regenerate');

  const fetchKeys = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/headless-api');
      const result = await response.json();
      if (result.success) {
        setKeys(result.data || []);
      }
    } catch {
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setShowForm(true);
  };

  const handleEdit = (key) => {
    setEditingId(key.id);
    setForm({
      siteName: key.siteName,
      domain: key.domain,
      enabled: key.enabled,
      allowedModules: Array.isArray(key.allowedModules) ? key.allowedModules : [],
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(INITIAL_FORM);
  };

  const handleSave = async () => {
    if (!form.siteName.trim()) {
      toast.error('Site name is required');
      return;
    }
    if (!form.domain.trim()) {
      toast.error('Domain is required');
      return;
    }
    if (form.allowedModules.length === 0) {
      toast.error('Select at least one module');
      return;
    }

    setSaving(true);
    try {
      const url = '/api/settings/headless-api';
      const body = editingId
        ? { id: editingId, ...form }
        : form;
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json();

      if (result.success) {
        toast.success(editingId ? 'API key updated' : 'API key created');
        setShowForm(false);
        setEditingId(null);
        setForm(INITIAL_FORM);
        fetchKeys();
      } else {
        toast.error(result.message || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save API key');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/settings/headless-api?id=${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        toast.success('API key deleted');
        setDeleteTarget(null);
        fetchKeys();
      } else {
        toast.error(result.message || 'Failed to delete');
      }
    } catch {
      toast.error('Failed to delete API key');
    } finally {
      setDeleting(false);
    }
  };

  const handleRegenerate = async (key) => {
    setRegenerating(key.id);
    try {
      const response = await fetch('/api/settings/headless-api', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regenerate', id: key.id }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('API key regenerated');
        fetchKeys();
      } else {
        toast.error(result.message || 'Failed to regenerate');
      }
    } catch {
      toast.error('Failed to regenerate API key');
    } finally {
      setRegenerating(null);
    }
  };

  const handleToggle = async (key) => {
    try {
      const response = await fetch('/api/settings/headless-api', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', id: key.id }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success(`API key ${key.enabled ? 'disabled' : 'enabled'}`);
        fetchKeys();
      } else {
        toast.error(result.message || 'Failed to toggle');
      }
    } catch {
      toast.error('Failed to toggle API key');
    }
  };

  const handleCopyKey = (keyId) => {
    const key = keys.find((k) => k.id === keyId);
    if (!key) return;
    navigator.clipboard.writeText(key.apiKeyFull).then(() => {
      setCopied(keyId);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const toggleKeyVisibility = (keyId) => {
    setVisibleKeys((prev) => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const toggleModule = (moduleId) => {
    setForm((prev) => {
      const modules = prev.allowedModules.includes(moduleId)
        ? prev.allowedModules.filter((m) => m !== moduleId)
        : [...prev.allowedModules, moduleId];
      return { ...prev, allowedModules: modules };
    });
  };

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Headless API"
        description="Manage external website API access"
        icon={Key}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {keys.length} API key{keys.length !== 1 ? 's' : ''} configured
              </p>
            </div>
            {canCreate && (
              <Button onClick={handleCreate} icon={Plus} size="sm" disabled={showForm}>
                Add API Key
              </Button>
            )}
          </div>

          {showForm && canCreate && (
            <Card padding="md" className="border-2" style={{ borderColor: accentColor + '40' }}>
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">
                    {editingId ? 'Edit API Key' : 'New API Key'}
                  </h4>
                  <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Site Name"
                    placeholder="e.g. PIOLEC Website"
                    value={form.siteName}
                    onChange={(e) => setForm({ ...form, siteName: e.target.value })}
                    required
                    disabled={!canCreate && !canUpdate}
                  />
                  <Input
                    label="Domain"
                    placeholder="e.g. piolec.ma"
                    value={form.domain}
                    onChange={(e) => setForm({ ...form, domain: e.target.value })}
                    required
                    disabled={!canCreate && !canUpdate}
                  />
                </div>

                <Toggle
                  label="Enabled"
                  description="Allow this site to access the API"
                  checked={form.enabled}
                  onChange={(v) => setForm({ ...form, enabled: v })}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allowed Modules
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_MODULES.map((mod) => {
                      const isSelected = form.allowedModules.includes(mod.id);
                      return (
                        <button
                          key={mod.id}
                          onClick={() => toggleModule(mod.id)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                            isSelected
                              ? 'text-white border-transparent'
                              : 'text-gray-600 border-gray-200 hover:border-gray-300'
                          }`}
                          style={isSelected ? { backgroundColor: accentColor } : {}}
                        >
                          {isSelected && <Check size={14} className="inline mr-1" />}
                          {mod.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="ghost" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} loading={saving} icon={Key}>
                    {editingId ? 'Update Key' : 'Create Key'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading API keys...</div>
          ) : keys.length === 0 && !showForm ? (
            <div className="text-center py-12 text-gray-400">
              <Key size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium text-gray-500">No API keys yet</p>
              <p className="text-sm mt-1">
                {canCreate
                  ? 'Create your first API key to allow external websites to consume your CMS content.'
                  : 'No API keys have been configured yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    key.enabled
                      ? 'border-gray-200 hover:border-gray-300 bg-white'
                      : 'border-gray-100 bg-gray-50 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Globe size={16} className="text-gray-400 shrink-0" />
                        <h5 className="font-semibold text-gray-800 truncate">{key.siteName}</h5>
                        <Badge variant={key.enabled ? 'success' : 'default'} size="sm">
                          {key.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{key.domain}</p>

                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-600 truncate max-w-md">
                          {visibleKeys[key.id] ? key.apiKeyFull : key.apiKey}
                        </code>
                        <button
                          onClick={() => toggleKeyVisibility(key.id)}
                          className="text-gray-400 hover:text-gray-600 shrink-0"
                          title={visibleKeys[key.id] ? 'Hide' : 'Show'}
                        >
                          {visibleKeys[key.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          onClick={() => handleCopyKey(key.id)}
                          className="text-gray-400 hover:text-gray-600 shrink-0"
                          title="Copy full key"
                        >
                          {copied === key.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(key.allowedModules) ? key.allowedModules : []).map((m) => (
                          <Badge key={m} variant="info" size="sm">
                            {m}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {canUpdate && (
                        <>
                          <button
                            onClick={() => handleToggle(key)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              key.enabled
                                ? 'text-green-500 hover:text-green-700 hover:bg-green-50'
                                : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                            }`}
                            title={key.enabled ? 'Disable' : 'Enable'}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEdit(key)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </>
                      )}
                      {canRegenerate && (
                        <button
                          onClick={() => handleRegenerate(key)}
                          disabled={regenerating === key.id}
                          className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Regenerate key"
                        >
                          <RefreshCw size={16} className={regenerating === key.id ? 'animate-spin' : ''} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setDeleteTarget(key)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SettingsSection>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete API Key"
        message={`Are you sure you want to delete the API key for "${deleteTarget?.siteName}"? This action cannot be undone and the external site will lose API access immediately.`}
        confirmText="Delete Key"
        loading={deleting}
      />
    </div>
  );
}

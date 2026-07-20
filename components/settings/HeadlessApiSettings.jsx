import { useState, useEffect, useCallback } from 'react';
import { Key, Globe, Plus, Trash2, RefreshCw, Copy, Eye, EyeOff, Check, X, Download, ChevronDown, ChevronRight, BookOpen, Code } from 'lucide-react';
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

const ENDPOINTS = [
  {
    method: 'GET',
    path: '/projects',
    title: 'List Projects',
    description: 'Retrieve a paginated list of published projects with optional filtering and search.',
    module: 'projects',
    parameters: [
      { name: 'page', type: 'number', required: false, default: '1', description: 'Page number for pagination' },
      { name: 'limit', type: 'number', required: false, default: '12', description: 'Items per page (max 100)' },
      { name: 'search', type: 'string', required: false, default: '""', description: 'Search term to filter projects' },
      { name: 'category', type: 'string', required: false, default: '""', description: 'Filter by category slug' },
      { name: 'year', type: 'number', required: false, default: 'null', description: 'Filter by publication year' },
      { name: 'sort', type: 'string', required: false, default: 'publishedAt', description: 'Sort field (publishedAt, createdAt, title)' },
      { name: 'order', type: 'string', required: false, default: 'desc', description: 'Sort order (asc or desc)' },
    ],
    responseExample: {
      success: true,
      data: {
        items: [
          {
            id: 'clx1234567890',
            title: 'Project Title',
            slug: 'project-title',
            status: 'PUBLISHED',
            description: 'Short description',
            fullDescription: { type: 'paragraph', content: 'Full description...' },
            featuredImage: 'https://res.cloudinary.com/.../image.jpg',
            tags: ['tag1', 'tag2'],
            publishedAt: '2025-01-15T10:30:00.000Z',
            createdAt: '2025-01-10T08:00:00.000Z',
            category: { id: 'cat_01', name: 'Web Development', slug: 'web-development' },
          },
        ],
        pagination: { page: 1, limit: 12, total: 45, totalPages: 4 },
      },
      message: 'Success',
    },
  },
  {
    method: 'GET',
    path: '/projects/{slug}',
    title: 'Get Project by Slug',
    description: 'Retrieve a single published project by its unique slug.',
    module: 'projects',
    parameters: [
      { name: 'slug', type: 'string', required: true, default: '—', description: 'The unique project slug' },
    ],
    responseExample: {
      success: true,
      data: {
        id: 'clx1234567890',
        title: 'Project Title',
        slug: 'project-title',
        status: 'PUBLISHED',
        description: 'Short description',
        fullDescription: { type: 'list', items: ['Item 1', 'Item 2'] },
        featuredImage: 'https://res.cloudinary.com/.../image.jpg',
        tags: ['tag1', 'tag2'],
        publishedAt: '2025-01-15T10:30:00.000Z',
        createdAt: '2025-01-10T08:00:00.000Z',
        category: { id: 'cat_01', name: 'Web Development', slug: 'web-development' },
      },
      message: 'Success',
    },
  },
];

const ERROR_RESPONSES = [
  { status: 401, title: 'Invalid API Key', description: 'The provided API key does not exist or is malformed.', color: 'red' },
  { status: 403, title: 'Module Disabled', description: 'The requested module is not enabled for this API key.', color: 'orange' },
  { status: 403, title: 'API Key Disabled', description: 'The API key has been disabled by an administrator.', color: 'orange' },
  { status: 404, title: 'Not Found', description: 'The requested resource does not exist.', color: 'gray' },
  { status: 405, title: 'Method Not Allowed', description: 'The HTTP method is not supported for this endpoint.', color: 'gray' },
  { status: 429, title: 'Rate Limited', description: 'Too many requests. Please try again later.', color: 'yellow' },
  { status: 500, title: 'Internal Server Error', description: 'An unexpected error occurred on the server.', color: 'red' },
];

const REQUIRED_HEADERS = [
  { name: 'x-api-key', value: '{YOUR_API_KEY}', description: 'Your headless API key for authentication' },
  { name: 'Content-Type', value: 'application/json', description: 'Request body format' },
  { name: 'Accept', value: 'application/json', description: 'Expected response format' },
];

function generateCurlExample(domain, apiKey, endpointPath) {
  return `curl -X GET "https://${domain}/api/public${endpointPath}" \\
  -H "x-api-key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json"`;
}

function generateFetchExample(domain, apiKey, endpointPath) {
  return `const response = await fetch(
  'https://${domain}/api/public${endpointPath}',
  {
    method: 'GET',
    headers: {
      'x-api-key': '${apiKey}',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  }
);

const data = await response.json();
console.log(data);`;
}

function generateAxiosExample(domain, apiKey, endpointPath) {
  return `import axios from 'axios';

const response = await axios.get(
  'https://${domain}/api/public${endpointPath}',
  {
    headers: {
      'x-api-key': '${apiKey}',
      'Content-Type': 'application/json',
    },
  }
);

console.log(response.data);`;
}

function generateNodeExample(domain, apiKey, endpointPath) {
  return `const https = require('https');

const options = {
  hostname: '${domain}',
  path: '/api/public${endpointPath}',
  method: 'GET',
  headers: {
    'x-api-key': '${apiKey}',
    'Content-Type': 'application/json',
  },
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => { console.log(JSON.parse(body)); });
});

req.end();`;
}

function generatePhpExample(domain, apiKey, endpointPath) {
  return `<?php

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => 'https://${domain}/api/public${endpointPath}',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'x-api-key: ${apiKey}',
        'Content-Type: application/json',
    ],
]);

$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
print_r($data);`;
}

function generatePythonExample(domain, apiKey, endpointPath) {
  return `import requests

url = "https://${domain}/api/public${endpointPath}"
headers = {
    "x-api-key": "${apiKey}",
    "Content-Type": "application/json",
}

response = requests.get(url, headers=headers)
data = response.json()
print(data)`;
}

function generateMarkdownDoc(domain, apiKey, keyData, now) {
  const date = now.toISOString().split('T')[0];
  let md = `# PIOLEC CMS — Headless API Documentation

Generated on: ${date}

---

## Base URL

\`\`\`
https://${domain}/api/public
\`\`\`

## Authentication

All requests require an \`x-api-key\` header.

| Header | Value |
|--------|-------|
| x-api-key | \`${apiKey}\` |
| Content-Type | application/json |
| Accept | application/json |

## Enabled Modules

${(keyData.allowedModules || []).map((m) => `- ${m}`).join('\n')}

---

## Endpoints

`;

  ENDPOINTS.forEach((ep) => {
    if (!keyData.allowedModules?.includes(ep.module)) return;
    md += `### ${ep.method} ${ep.path}\n\n`;
    md += `${ep.description}\n\n`;
    md += `**Module:** ${ep.module} | **Authentication:** Required\n\n`;

    if (ep.parameters.length > 0) {
      md += `#### Parameters\n\n`;
      md += `| Name | Type | Required | Default | Description |\n`;
      md += `|------|------|----------|---------|-------------|\n`;
      ep.parameters.forEach((p) => {
        md += `| ${p.name} | ${p.type} | ${p.required ? 'Yes' : 'No'} | \`${p.default}\` | ${p.description} |\n`;
      });
      md += `\n`;
    }

    md += `#### Response Example\n\n`;
    md += `\`\`\`json\n${JSON.stringify(ep.responseExample, null, 2)}\n\`\`\`\n\n`;
    md += `---\n\n`;
  });

  md += `## Error Codes\n\n`;
  md += `| Status | Title | Description |\n`;
  md += `|--------|-------|-------------|\n`;
  ERROR_RESPONSES.forEach((e) => {
    md += `| ${e.status} | ${e.title} | ${e.description} |\n`;
  });

  md += `\n---\n\n`;
  md += `## Code Examples\n\n`;

  md += `### cURL\n\n\`\`\`bash\n`;
  md += generateCurlExample(domain, apiKey, '/projects');
  md += `\n\`\`\`\n\n`;

  md += `### JavaScript (Fetch)\n\n\`\`\`javascript\n`;
  md += generateFetchExample(domain, apiKey, '/projects');
  md += `\n\`\`\`\n\n`;

  md += `### Python\n\n\`\`\`python\n`;
  md += generatePythonExample(domain, apiKey, '/projects');
  md += `\n\`\`\`\n`;

  return md;
}

function CopyButton({ text, label, toast: toastFn }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toastFn.success(`${label} copied!`);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
      title={`Copy ${label}`}
    >
      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
      {copied ? 'Copied' : label}
    </button>
  );
}

function JsonViewer({ data, title }) {
  const [collapsed, setCollapsed] = useState(false);
  const json = JSON.stringify(data, null, 2);
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 cursor-pointer select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">{title}</span>
        {collapsed ? <ChevronRight size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </div>
      {!collapsed && (
        <pre className="p-4 text-xs font-mono bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 overflow-x-auto max-h-80 leading-relaxed">
          {json}
        </pre>
      )}
    </div>
  );
}

function EndpointCard({ endpoint, accentColor }) {
  const methodColors = {
    GET: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    POST: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    PUT: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
      <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/80 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-0.5 text-xs font-bold rounded-md ${methodColors[endpoint.method]}`}>
            {endpoint.method}
          </span>
          <code className="text-sm font-mono font-semibold text-gray-800 dark:text-gray-200">{endpoint.path}</code>
        </div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{endpoint.description}</p>
      </div>
      <div className="px-5 py-3 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <Key size={12} />
          <span>Authentication required</span>
        </div>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <div className="flex items-center gap-1">
          <span>Module: <span className="font-semibold text-gray-700 dark:text-gray-300">{endpoint.module}</span></span>
        </div>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <Badge variant="success" size="sm">Active</Badge>
      </div>
    </div>
  );
}

function ErrorCard({ error }) {
  const colorMap = {
    red: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20',
    orange: 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20',
    yellow: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20',
    gray: 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50',
  };
  const badgeMap = {
    red: 'danger',
    orange: 'warning',
    yellow: 'warning',
    gray: 'default',
  };
  return (
    <div className={`rounded-lg border p-3 ${colorMap[error.color]}`}>
      <div className="flex items-center gap-2">
        <Badge variant={badgeMap[error.color]} size="sm">{error.status}</Badge>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{error.title}</span>
      </div>
      <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 ml-14">{error.description}</p>
    </div>
  );
}

function CodeExampleTabs({ domain, apiKey, toast: toastFn }) {
  const [activeTab, setActiveTab] = useState('curl');

  const tabs = [
    { id: 'curl', label: 'cURL' },
    { id: 'fetch', label: 'JavaScript' },
    { id: 'axios', label: 'Axios' },
    { id: 'node', label: 'Node.js' },
    { id: 'php', label: 'PHP' },
    { id: 'python', label: 'Python' },
  ];

  const examples = {
    curl: generateCurlExample(domain, apiKey, '/projects'),
    fetch: generateFetchExample(domain, apiKey, '/projects'),
    axios: generateAxiosExample(domain, apiKey, '/projects'),
    node: generateNodeExample(domain, apiKey, '/projects'),
    php: generatePhpExample(domain, apiKey, '/projects'),
    python: generatePythonExample(domain, apiKey, '/projects'),
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto">
          <CopyButton text={examples[activeTab]} label="Code" toast={toastFn} />
        </div>
      </div>
      <pre className="p-4 text-xs font-mono bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 overflow-x-auto leading-relaxed">
        {examples[activeTab]}
      </pre>
    </div>
  );
}

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
  const [selectedKeyId, setSelectedKeyId] = useState(null);

  const canCreate = can('headless.create');
  const canUpdate = can('headless.update');
  const canDelete = can('headless.delete');
  const canRegenerate = can('headless.regenerate');

  const selectedKey = keys.find((k) => k.id === selectedKeyId);

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

  useEffect(() => {
    if (selectedKeyId && !keys.find((k) => k.id === selectedKeyId)) {
      setSelectedKeyId(null);
    }
  }, [keys, selectedKeyId]);

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
        if (selectedKeyId === deleteTarget.id) setSelectedKeyId(null);
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

  const handleDownloadDocs = () => {
    if (!selectedKey) return;
    const md = generateMarkdownDoc(selectedKey.domain, selectedKey.apiKeyFull, selectedKey, new Date());
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `piolec-api-docs-${selectedKey.siteName.replace(/\s+/g, '-').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Documentation downloaded!');
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
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Key size={36} className="text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">No API Key has been created yet.</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-sm mx-auto">
                Create your first API key to allow external websites to consume your CMS content via the headless API.
              </p>
              {canCreate && (
                <Button onClick={handleCreate} icon={Plus}>
                  Create API Key
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => (
                <div
                  key={key.id}
                  onClick={() => setSelectedKeyId(key.id)}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    selectedKeyId === key.id
                      ? 'border-current shadow-md'
                      : key.enabled
                        ? 'border-gray-200 hover:border-gray-300 bg-white'
                        : 'border-gray-100 bg-gray-50 opacity-75'
                  }`}
                  style={selectedKeyId === key.id ? { borderColor: accentColor, backgroundColor: accentColor + '08' } : {}}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Globe size={16} className="text-gray-400 shrink-0" />
                        <h5 className="font-semibold text-gray-800 truncate">{key.siteName}</h5>
                        <Badge variant={key.enabled ? 'success' : 'default'} size="sm">
                          {key.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                        {selectedKeyId === key.id && (
                          <Badge variant="primary" size="sm">Selected</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{key.domain}</p>

                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-600 truncate max-w-md">
                          {visibleKeys[key.id] ? key.apiKeyFull : key.apiKey}
                        </code>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleKeyVisibility(key.id); }}
                          className="text-gray-400 hover:text-gray-600 shrink-0"
                          title={visibleKeys[key.id] ? 'Hide' : 'Show'}
                        >
                          {visibleKeys[key.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopyKey(key.id); }}
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

                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
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

      {selectedKey && (
        <Card padding="none">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: accentColor + '15' }}>
                  <BookOpen size={20} style={{ color: accentColor }} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Developer Documentation</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    API reference for <span className="font-medium text-gray-700 dark:text-gray-300">{selectedKey.siteName}</span>
                  </p>
                </div>
              </div>
              <Button onClick={handleDownloadDocs} variant="secondary" size="sm" icon={Download}>
                Download Docs
              </Button>
            </div>
          </div>

          <div className="p-6 space-y-8">

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wide">API Information</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <Globe size={16} className="text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Base URL</p>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-sm font-mono text-gray-800 dark:text-gray-200">
                          https://{selectedKey.domain}/api/public
                        </code>
                        <CopyButton text={`https://${selectedKey.domain}/api/public`} label="URL" toast={toast} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <Key size={16} className="text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Authentication</p>
                      <div className="mt-1">
                        <code className="text-sm font-mono text-gray-800 dark:text-gray-200">x-api-key</code>
                        <span className="text-gray-400 mx-2">→</span>
                        <code className="text-sm font-mono text-gray-800 dark:text-gray-200 truncate max-w-xs inline-block">
                          {visibleKeys[selectedKey.id] ? selectedKey.apiKeyFull : selectedKey.apiKey}
                        </code>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <Code size={16} className="text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Content Type</p>
                      <code className="text-sm font-mono text-gray-800 dark:text-gray-200 mt-1 block">application/json</code>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wide">Required Headers</h4>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Header</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Value</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Copy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {REQUIRED_HEADERS.map((h) => (
                        <tr key={h.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-4 py-2.5">
                            <code className="text-xs font-mono font-semibold text-gray-800 dark:text-gray-200">{h.name}</code>
                          </td>
                          <td className="px-4 py-2.5">
                            <code className="text-xs font-mono text-gray-600 dark:text-gray-400">
                              {h.name === 'x-api-key' ? (visibleKeys[selectedKey.id] ? selectedKey.apiKeyFull : selectedKey.apiKey) : h.value}
                            </code>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <CopyButton text={h.name === 'x-api-key' ? selectedKey.apiKeyFull : h.value} label="Value" toast={toast} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wide">Endpoints</h4>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  {ENDPOINTS.filter((e) => selectedKey.allowedModules?.includes(e.module)).length} available
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {ENDPOINTS.filter((ep) => selectedKey.allowedModules?.includes(ep.module)).map((ep) => (
                  <div key={ep.path}>
                    <EndpointCard endpoint={ep} accentColor={accentColor} />
                    {ep.parameters.length > 0 && (
                      <div className="mt-3 ml-2">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Parameters</p>
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Name</th>
                                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Type</th>
                                <th className="text-center px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Required</th>
                                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Default</th>
                                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Description</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                              {ep.parameters.map((p) => (
                                <tr key={p.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                  <td className="px-4 py-2"><code className="text-xs font-mono font-semibold text-gray-800 dark:text-gray-200">{p.name}</code></td>
                                  <td className="px-4 py-2"><Badge variant="info" size="sm">{p.type}</Badge></td>
                                  <td className="px-4 py-2 text-center">
                                    {p.required
                                      ? <span className="text-xs font-semibold text-red-500">Yes</span>
                                      : <span className="text-xs text-gray-400">No</span>}
                                  </td>
                                  <td className="px-4 py-2"><code className="text-xs font-mono text-gray-500 dark:text-gray-400">{p.default}</code></td>
                                  <td className="px-4 py-2 text-xs text-gray-600 dark:text-gray-400">{p.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    <div className="mt-3 ml-2">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Response Example</p>
                        <CopyButton text={JSON.stringify(ep.responseExample, null, 2)} label="JSON" toast={toast} />
                        <CopyButton text={`https://${selectedKey.domain}/api/public${ep.path}`} label="URL" toast={toast} />
                      </div>
                      <JsonViewer data={ep.responseExample} title={`${ep.method} ${ep.path} — 200 OK`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wide">Error Responses</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ERROR_RESPONSES.map((e) => (
                  <ErrorCard key={`${e.status}-${e.title}`} error={e} />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wide">Code Examples</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Ready-to-use examples with your current API key. All examples use the <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">/projects</code> endpoint.
              </p>
              <CodeExampleTabs domain={selectedKey.domain} apiKey={selectedKey.apiKeyFull} toast={toast} />
            </div>

          </div>
        </Card>
      )}

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

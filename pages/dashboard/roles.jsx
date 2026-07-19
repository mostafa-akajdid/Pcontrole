import { useState, useEffect, useCallback } from 'react';
import { Plus, Shield, Users, Search, MoreVertical, Edit, Trash2, Copy, Eye, ChevronDown, ChevronRight, Lock, X } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import PermissionGuard from '@/components/ui/PermissionGuard';
import { useAppearance } from '@/contexts/AppearanceContext';
import { useToast } from '@/contexts/ToastContext';

const MODULE_LABELS = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  'project-categories': 'Project Categories',
  blogs: 'Blogs',
  'blog-categories': 'Blog Categories',
  media: 'Media',
  users: 'Users',
  roles: 'Roles',
  settings: 'Settings',
};

export default function RolesPage() {
  const { accentColor } = useAppearance();
  const toast = useToast();
  const [roles, setRoles] = useState([]);
  const [permissionsByModule, setPermissionsByModule] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingRole, setDeletingRole] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [expandedModules, setExpandedModules] = useState({});
  const [actionMenuOpen, setActionMenuOpen] = useState(null);

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPermissionIds, setFormPermissionIds] = useState([]);
  const [formSaving, setFormSaving] = useState(false);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/roles');
      const data = await res.json();
      if (data.success) setRoles(data.data);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    try {
      const res = await fetch('/api/roles/permissions-by-module');
      const data = await res.json();
      if (data.success) setPermissionsByModule(data.data);
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, [fetchRoles, fetchPermissions]);

  const openCreateForm = () => {
    setEditingRole(null);
    setFormName('');
    setFormDescription('');
    setFormPermissionIds([]);
    setShowForm(true);
  };

  const openEditForm = (role) => {
    setEditingRole(role);
    setFormName(role.name);
    setFormDescription(role.description || '');
    setFormPermissionIds(role.permissions?.map((p) => p.id) || []);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName || formName.length < 2) return;
    setFormSaving(true);
    try {
      const url = editingRole ? `/api/roles/${editingRole.id}` : '/api/roles';
      const method = editingRole ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, description: formDescription, permissionIds: formPermissionIds }),
      });
      const data = await res.json();
      if (data.success) {
        fetchRoles();
        setShowForm(false);
        setEditingRole(null);
      }
    } catch (err) {
      console.error('Save role failed:', err);
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRole) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/roles/${deletingRole.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Role deleted');
        setShowDeleteConfirm(false);
        setDeletingRole(null);
        fetchRoles();
      } else {
        toast.error(data.message || 'Failed to delete role');
      }
    } catch {
      toast.error('Failed to delete role');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleClone = async (role) => {
    try {
      const res = await fetch(`/api/roles/${role.id}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${role.name} (Copy)` }),
      });
      const data = await res.json();
      if (data.success) fetchRoles();
    } catch (err) {
      console.error('Clone failed:', err);
    }
    setActionMenuOpen(null);
  };

  const togglePermission = (permId) => {
    setFormPermissionIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const toggleModulePermissions = (modulePerms) => {
    const allIds = modulePerms.map((p) => p.id);
    const allSelected = allIds.every((id) => formPermissionIds.includes(id));
    if (allSelected) {
      setFormPermissionIds((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      setFormPermissionIds((prev) => [...new Set([...prev, ...allIds])]);
    }
  };

  const toggleModule = (module) => {
    setExpandedModules((prev) => ({ ...prev, [module]: !prev[module] }));
  };

  const filteredRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="Roles & Permissions" description="Manage roles and their permissions">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Roles & Permissions</h1>
          <p className="text-gray-500 text-sm">Define roles and control what each role can access</p>
        </div>
        <PermissionGuard permission="roles.create">
          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-all shadow-lg"
            style={{ backgroundColor: accentColor }}
          >
            <Plus size={16} /> Create Role
          </button>
        </PermissionGuard>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Roles" value={String(roles.length)} trend="All" subtext="defined roles" />
        <StatCard title="Total Permissions" value={String(Object.values(permissionsByModule).flat().length)} trend="System" subtext="available permissions" />
        <StatCard title="System Roles" value={String(roles.filter((r) => r.isSystem).length)} trend="Protected" subtext="cannot be deleted" />
      </div>

      <div className="bg-white rounded-xl p-4 mb-6 border border-gray-100">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search roles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white text-gray-800"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : filteredRoles.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No roles found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoles.map((role) => (
            <div key={role.id} className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${role.isSystem ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <Shield size={20} className={role.isSystem ? 'text-blue-600' : 'text-gray-500'} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{role.name}</h3>
                    {role.isSystem && (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                        <Lock size={10} /> System Role
                      </span>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <button onClick={() => setActionMenuOpen(actionMenuOpen === role.id ? null : role.id)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
                    <MoreVertical size={16} />
                  </button>
                  {actionMenuOpen === role.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setActionMenuOpen(null)} />
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-20">
                        <button onClick={() => { setSelectedRole(role); setShowDetail(true); setActionMenuOpen(null); }} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                          <Eye size={14} /> View Details
                        </button>
                        {!role.isSystem && (
                          <>
                            <button onClick={() => { openEditForm(role); setActionMenuOpen(null); }} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                              <Edit size={14} /> Edit
                            </button>
                            <button onClick={() => handleClone(role)} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                              <Copy size={14} /> Clone
                            </button>
                            <div className="border-t border-gray-100 my-1" />
                            <button onClick={() => { setDeletingRole(role); setShowDeleteConfirm(true); setActionMenuOpen(null); }} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                              <Trash2 size={14} /> Delete
                            </button>
                          </>
                        )}
                        {role.isSystem && (
                          <button onClick={() => handleClone(role)} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <Copy size={14} /> Clone Role
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{role.description || 'No description'}</p>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Users size={14} className="text-gray-400" />
                  <span>{role._count?.users || 0} users</span>
                </div>
                <span className="text-xs text-gray-500">{role.permissions?.length || 0} permissions</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Role Modal */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[100]" onClick={() => setShowForm(false)} />
          <div className="fixed inset-y-0 right-0 w-full sm:w-[600px] bg-white shadow-2xl z-[101] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{editingRole ? 'Edit Role' : 'Create Role'}</h2>
                <p className="text-sm text-gray-500">Define role name and permissions</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. CONTENT_MANAGER"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe what this role can do..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 text-sm resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Permissions</label>
                  <span className="text-xs text-gray-500">{formPermissionIds.length} selected</span>
                </div>

                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                  {Object.entries(permissionsByModule).map(([module, perms]) => {
                    const allSelected = perms.every((p) => formPermissionIds.includes(p.id));
                    const someSelected = perms.some((p) => formPermissionIds.includes(p.id)) && !allSelected;
                    const isExpanded = expandedModules[module] !== false;

                    return (
                      <div key={module} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 cursor-pointer" onClick={() => toggleModule(module)}>
                          <button className="text-gray-400">
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(el) => { if (el) el.indeterminate = someSelected; }}
                            onChange={() => toggleModulePermissions(perms)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <span className="text-sm font-medium text-gray-700">{MODULE_LABELS[module] || module}</span>
                          <span className="text-xs text-gray-500 ml-auto">{perms.filter((p) => formPermissionIds.includes(p.id)).length}/{perms.length}</span>
                        </div>
                        {isExpanded && (
                          <div className="px-4 py-2 space-y-1">
                            {perms.map((perm) => (
                              <label key={perm.id} className="flex items-center gap-3 py-1.5 cursor-pointer hover:bg-gray-50 rounded px-2">
                                <input
                                  type="checkbox"
                                  checked={formPermissionIds.includes(perm.id)}
                                  onChange={() => togglePermission(perm.id)}
                                  className="w-4 h-4 rounded border-gray-300"
                                />
                                <span className="text-sm text-gray-700">{perm.action}</span>
                                {perm.description && <span className="text-xs text-gray-400 ml-auto">{perm.description}</span>}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button onClick={handleSave} variant="primary" size="md" rounded="lg" fullWidth disabled={formSaving || !formName}>
                  {formSaving ? 'Saving...' : editingRole ? 'Update Role' : 'Create Role'}
                </Button>
                <Button onClick={() => setShowForm(false)} variant="secondary" size="md" rounded="lg" fullWidth>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Role Detail Modal */}
      {showDetail && selectedRole && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowDetail(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-xl font-bold text-gray-800">Role Details</h2>
                <button onClick={() => setShowDetail(false)} className="text-gray-400 hover:text-gray-600"><span className="text-xl">✕</span></button>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${selectedRole.isSystem ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <Shield size={24} className={selectedRole.isSystem ? 'text-blue-600' : 'text-gray-500'} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{selectedRole.name}</h3>
                    <p className="text-sm text-gray-500">{selectedRole.description || 'No description'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Users</p>
                    <p className="text-lg font-bold text-gray-800">{selectedRole._count?.users || 0}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Permissions</p>
                    <p className="text-lg font-bold text-gray-800">{selectedRole.permissions?.length || 0}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 uppercase">Assigned Permissions</h4>
                  <div className="space-y-2">
                    {Object.entries(
                      (selectedRole.permissions || []).reduce((acc, p) => {
                        if (!acc[p.module]) acc[p.module] = [];
                        acc[p.module].push(p);
                        return acc;
                      }, {})
                    ).map(([module, perms]) => (
                      <div key={module} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">{MODULE_LABELS[module] || module}</p>
                        <div className="flex flex-wrap gap-1">
                          {perms.map((p) => (
                            <span key={p.id} className="inline-block px-2 py-0.5 bg-white rounded text-xs text-gray-600 border border-gray-200">{p.action}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  {!selectedRole.isSystem && (
                    <button onClick={() => { setShowDetail(false); openEditForm(selectedRole); }} className="flex-1 text-white py-2.5 rounded-lg font-medium hover:opacity-90" style={{ backgroundColor: accentColor }}>Edit Role</button>
                  )}
                  <button onClick={() => setShowDetail(false)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200">Close</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeletingRole(null); }}
        onConfirm={handleDelete}
        title="Delete Role"
        message={`Are you sure you want to delete "${deletingRole?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={deleteLoading}
      />
    </DashboardLayout>
  );
}

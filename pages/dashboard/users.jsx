import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Plus, Search, Users, UserCheck, UserX, Shield, MoreVertical, Eye, Edit, Trash2, Key, ArrowUpDown, Grid, List } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import UserFormModal from '@/components/modals/UserFormModal';
import UserDetailModal from '@/components/modals/UserDetailModal';
import { useToast } from '@/contexts/ToastContext';
import PermissionGuard from '@/components/ui/PermissionGuard';
import { useAppearance } from '@/contexts/AppearanceContext';
import { useAuth } from '@/contexts/AuthContext';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

const STATUS_STYLES = {
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-700' },
  INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-600' },
  SUSPENDED: { bg: 'bg-red-100', text: 'text-red-700' },
};

export default function UsersPage() {
  const router = useRouter();
  const { accentColor } = useAppearance();
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, suspended: 0, deleted: 0, roleDistribution: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [pagination, setPagination] = useState(null);
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('table');

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
        search,
        status: statusFilter,
        roleId: roleFilter,
        sort,
        order,
      });

      const res = await fetch(`/api/users?${params}`);
      const data = await res.json();

      if (data.success) {
        setUsers(data.data?.items || []);
        setPagination(data.data?.pagination || { page: 1, perPage: 10, total: 0, totalPages: 1, hasNext: false, hasPrev: false });
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, statusFilter, roleFilter, sort, order]);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch('/api/roles');
      const data = await res.json();
      if (data.success) setRoles(data.data);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/users/stats');
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchRoles();
    fetchStats();
  }, [fetchRoles, fetchStats]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, roleFilter]);

  const handleCreate = async (formData) => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    fetchUsers();
    fetchStats();
  };

  const handleUpdate = async (formData) => {
    const res = await fetch(`/api/users/${editingUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    fetchUsers();
    fetchStats();
    setEditingUser(null);
    setShowForm(false);
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/users/${deletingUser.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('User deleted');
        setShowDeleteConfirm(false);
        setDeletingUser(null);
        fetchUsers();
        fetchStats();
      } else {
        toast.error(data.message || 'Failed to delete user');
      }
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleStatusChange = async (userId, status) => {
    try {
      const res = await fetch(`/api/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
        fetchStats();
      }
    } catch (err) {
      console.error('Status change failed:', err);
    }
    setActionMenuOpen(null);
  };

  const handleResetPassword = async (userId, newPassword) => {
    try {
      const res = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
    } catch (err) {
      console.error('Reset password failed:', err);
    }
  };

  const handleForcePasswordChange = async (userId, enabled) => {
    try {
      const res = await fetch(`/api/users/${userId}/force-password-change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
        const updatedRes = await fetch(`/api/users/${userId}`);
        const updatedData = await updatedRes.json();
        if (updatedData.success) setSelectedUser(updatedData.data);
      }
    } catch (err) {
      console.error('Force password change failed:', err);
    }
  };

  const handleSort = (field) => {
    if (sort === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(field);
      setOrder('desc');
    }
    setPage(1);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <DashboardLayout title="Users - Management" description="Manage team members and their access">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Users</h1>
          <p className="text-gray-500 text-sm">Manage team members and their access permissions</p>
        </div>
        <PermissionGuard permission="users.create">
          <button
            onClick={() => { setEditingUser(null); setShowForm(true); }}
            className="flex items-center gap-2 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-all shadow-lg"
            style={{ backgroundColor: accentColor }}
          >
            <Plus size={16} /> Add User
          </button>
        </PermissionGuard>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Users" value={String(stats.total)} trend="All" subtext="registered users" />
        <StatCard title="Active Users" value={String(stats.active)} trend="Active" subtext="currently active" />
        <StatCard title="Inactive Users" value={String(stats.inactive)} trend="Inactive" subtext="need activation" />
        <StatCard title="Suspended" value={String(stats.suspended)} trend="Suspended" subtext="blocked accounts" />
      </div>

      <div className="bg-white rounded-xl p-4 mb-6 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white text-gray-800"
            />
          </div>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  statusFilter === opt.value
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={statusFilter === opt.value ? { backgroundColor: accentColor } : {}}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2"
          >
            <option value="">All Roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}>
              <List size={16} />
            </button>
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}>
              <Grid size={16} />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-gray-700" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">User <ArrowUpDown size={12} /></div>
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Role</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-gray-700" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1">Status <ArrowUpDown size={12} /></div>
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-gray-700" onClick={() => handleSort('createdAt')}>
                    <div className="flex items-center gap-1">Joined <ArrowUpDown size={12} /></div>
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Last Login</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No users found</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <span className="text-sm font-bold text-gray-400">{u.name?.charAt(0)}</span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-800">{u.name}</p>
                            <p className="text-sm text-gray-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          <Shield size={12} /> {u.role?.name || 'None'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[u.status]?.bg} ${STATUS_STYLES[u.status]?.text}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(u.createdAt)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Never'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-block">
                          <button onClick={() => setActionMenuOpen(actionMenuOpen === u.id ? null : u.id)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600">
                            <MoreVertical size={16} />
                          </button>
                          {actionMenuOpen === u.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActionMenuOpen(null)} />
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-20">
                                <button onClick={() => { setSelectedUser(u); setShowDetail(true); setActionMenuOpen(null); }} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                  <Eye size={14} /> View Profile
                                </button>
                                <button onClick={() => { setEditingUser(u); setShowForm(true); setActionMenuOpen(null); }} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                  <Edit size={14} /> Edit
                                </button>
                                {u.status === 'ACTIVE' ? (
                                  <button onClick={() => handleStatusChange(u.id, 'INACTIVE')} className="w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2">
                                    <UserX size={14} /> Deactivate
                                  </button>
                                ) : (
                                  <button onClick={() => handleStatusChange(u.id, 'ACTIVE')} className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2">
                                    <UserCheck size={14} /> Activate
                                  </button>
                                )}
                                {u.status !== 'SUSPENDED' && (
                                  <button onClick={() => handleStatusChange(u.id, 'SUSPENDED')} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                    <Shield size={14} /> Suspend
                                  </button>
                                )}
                                <div className="border-t border-gray-100 my-1" />
                                <button onClick={() => { setDeletingUser(u); setShowDeleteConfirm(true); setActionMenuOpen(null); }} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-12 text-gray-500">Loading...</div>
          ) : users.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">No users found</div>
          ) : (
            users.map((u) => (
              <div key={u.id} className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-400">{u.name?.charAt(0)}</span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-800">{u.name}</h3>
                      <p className="text-sm text-gray-500">{u.email}</p>
                    </div>
                  </div>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[u.status]?.bg} ${STATUS_STYLES[u.status]?.text}`}>
                    {u.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <Shield size={14} className="text-gray-400" />
                  <span>{u.role?.name || 'No Role'}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Joined {formatDate(u.createdAt)}</span>
                  <div className="flex gap-1">
                    <button onClick={() => { setSelectedUser(u); setShowDetail(true); }} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600"><Eye size={14} /></button>
                    <button onClick={() => { setEditingUser(u); setShowForm(true); }} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600"><Edit size={14} /></button>
                    <button onClick={() => { setDeletingUser(u); setShowDeleteConfirm(true); }} className="p-1.5 hover:bg-red-50 rounded-md text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">
            Showing {((page - 1) * perPage) + 1} to {Math.min(page * perPage, pagination.total)} of {pagination.total} users
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${page === pageNum ? 'text-white' : 'border border-gray-200 hover:bg-gray-50'}`}
                  style={page === pageNum ? { backgroundColor: accentColor } : {}}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <UserFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingUser(null); }}
        onSubmit={editingUser ? handleUpdate : handleCreate}
        user={editingUser}
        roles={roles}
      />

      <UserDetailModal
        isOpen={showDetail}
        onClose={() => { setShowDetail(false); setSelectedUser(null); }}
        user={selectedUser}
        onEdit={(u) => { setEditingUser(u); setShowForm(true); }}
        onStatusChange={handleStatusChange}
        onResetPassword={handleResetPassword}
        onForcePasswordChange={handleForcePasswordChange}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeletingUser(null); }}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${deletingUser?.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={deleteLoading}
      />
    </DashboardLayout>
  );
}

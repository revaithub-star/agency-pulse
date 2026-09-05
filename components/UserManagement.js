'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Shield, Check, X, Lock, Mail, UserCheck, UserX, Edit2, Trash2, AlertTriangle, Users } from 'lucide-react';
import { can } from '@/lib/permissions';

const availablePermissions = [
  { id: 'projects.read', label: 'View Projects' },
  { id: 'projects.write', label: 'Create/Edit Projects' },
  { id: 'clients.read', label: 'View Clients' },
  { id: 'clients.write', label: 'Create/Edit Clients' },
  { id: 'financials.read', label: 'View Financials' },
  { id: 'financials.write', label: 'Manage Payments/Expenses' },
  { id: 'reports.read', label: 'View & Export Reports' },
  { id: 'users.manage', label: 'Manage Users' },
];

const defaultAddForm = {
  email: '',
  password: '',
  role: 'staff',
  permissions: ['projects.read', 'projects.write', 'clients.read', 'financials.read']
};

export default function UserManagement({ authUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const [form, setForm] = useState(defaultAddForm);

  const canManage = can(authUser, 'users.manage');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleTogglePermission = (permId) => {
    setForm(prev => {
      const exists = prev.permissions.includes(permId);
      const nextPerms = exists
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId];
      return { ...prev, permissions: nextPerms };
    });
  };

  const openAdd = () => {
    setEditingUser(null);
    setError('');
    setForm(defaultAddForm);
    setShowModal(true);
  };

  const openEdit = async (user) => {
    setError('');
    try {
      const res = await fetch(`/api/users/${user.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load user');
      const perms = Array.isArray(data.permissions) ? data.permissions : [];
      setEditingUser(data);
      setForm({
        email: data.email || '',
        password: '',
        role: data.role || 'staff',
        permissions: perms.includes('*') ? [...availablePermissions.map(p => p.id)] : [...perms],
        isActive: data.isActive !== false,
      });
      setShowModal(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      let url, method, body;
      if (editingUser) {
        url = `/api/users/${editingUser.id}`;
        method = 'PUT';
        const payload = {
          email: form.email,
          role: form.role,
          permissions: form.permissions,
          isActive: form.isActive !== false,
        };
        if (form.password && form.password.length > 0) {
          if (form.password.length < 8) throw new Error('Password must be at least 8 characters');
          payload.password = form.password;
        }
        body = JSON.stringify(payload);
      } else {
        if (!form.password || form.password.length < 8) throw new Error('Password must be at least 8 characters');
        url = '/api/users';
        method = 'POST';
        body = JSON.stringify(form);
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (editingUser ? 'Failed to update user' : 'Failed to create user'));
      setShowModal(false);
      setEditingUser(null);
      setForm(defaultAddForm);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteError('');
    try {
      const res = await fetch(`/api/users/${deleteConfirm.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user');
      setDeleteConfirm(null);
      fetchUsers();
    } catch (err) {
      setDeleteError(err.message);
    }
  };

  const isAddMode = !editingUser;
  const allPermsSelected = form.permissions.length === availablePermissions.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Users & Access Control</h2>
          <p className="text-muted-foreground mt-1">
            Manage agency team members and role-based permissions.
          </p>
        </div>
        {canManage && (
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white text-black hover:bg-white/90 text-sm font-medium transition-colors"
          >
            <UserPlus size={16} /> Add User
          </button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="w-full overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left min-w-[900px]">
            <thead className="border-b border-border bg-muted/20 text-muted-foreground text-xs uppercase font-medium">
              <tr>
                <th className="p-4 whitespace-nowrap">User</th>
                <th className="p-4 whitespace-nowrap">Role</th>
                <th className="p-4 whitespace-nowrap">Permissions</th>
                <th className="p-4 whitespace-nowrap">Status</th>
                <th className="p-4 whitespace-nowrap">Created</th>
                {canManage && (
                  <th className="p-4 whitespace-nowrap text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="p-8 text-center text-muted-foreground text-sm">
                    {loading ? 'Loading users…' : 'No registered users found.'}
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isSelf = authUser && authUser.id === user.id;
                  const active = user.isActive !== false;
                  return (
                    <tr key={user.id || user.email} className="hover:bg-muted/20">
                      <td className="p-4 font-medium flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold shrink-0">
                          {(user.email || '??').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="truncate">{user.email}</span>
                          {isSelf && <span className="text-[10px] text-primary font-medium">(You)</span>}
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20' : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                        }`}>
                          <Shield size={12} />
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {Array.isArray(user.permissions) && user.permissions.includes('*') ? (
                            <span className="px-2 py-0.5 rounded bg-secondary text-[11px] font-mono text-muted-foreground">
                              All Permissions (*)
                            </span>
                          ) : (
                            Array.isArray(user.permissions) && user.permissions.length > 0 ? (
                              user.permissions.slice(0, 4).map((p) => (
                                <span key={p} className="px-2 py-0.5 rounded bg-secondary text-[10px] font-mono text-muted-foreground">
                                  {p}
                                </span>
                              )).concat(user.permissions.length > 4 ? [
                                <span key="+more" className="px-2 py-0.5 rounded bg-secondary text-[10px] font-mono text-muted-foreground">
                                  +{user.permissions.length - 4} more
                                </span>
                              ] : [])
                            ) : (
                              <span className="text-[11px] text-muted-foreground/70 italic">No permissions</span>
                            )
                          )}
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
                            <UserCheck size={12} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-500 text-xs font-medium">
                            <UserX size={12} /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-muted-foreground whitespace-nowrap">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      {canManage && (
                        <td className="p-4 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEdit(user)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-foreground text-muted-foreground transition-colors"
                              title="Edit user"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => { setDeleteError(''); setDeleteConfirm(user); }}
                              disabled={isSelf}
                              title={isSelf ? "You can't delete your own account" : "Delete user"}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background hover:bg-red-500/10 hover:text-red-600 text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl space-y-4 max-h-[92vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">
                {isAddMode ? 'Add New Team Member' : 'Edit Team Member'}
              </h3>
              <button onClick={() => { setShowModal(false); setEditingUser(null); }} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-xs text-red-500">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1 text-xs font-medium">
                <label className="flex items-center gap-1">
                  <Mail size={11} className="opacity-70" /> Email Address
                </label>
                <input
                  required type="email" placeholder="colleague@agency.com"
                  className="w-full rounded-md border border-input bg-transparent pl-3 p-2 text-xs focus:ring-2 focus:ring-ring"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="space-y-1 text-xs font-medium">
                <label className="flex items-center gap-1">
                  <Lock size={11} className="opacity-70" /> Password
                  {!isAddMode && <span className="text-muted-foreground font-normal ml-1">(leave blank to keep current)</span>}
                </label>
                <input
                  type="password" placeholder={isAddMode ? '•••••••• (min 8 chars)' : '••••••••'}
                  minLength={isAddMode ? 8 : undefined}
                  className="w-full rounded-md border border-input bg-transparent pl-3 p-2 text-xs focus:ring-2 focus:ring-ring"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
              </div>

              {!isAddMode && (
                <div className="space-y-1 text-xs font-medium">
                  <label>Account Status</label>
                  <div className="flex items-center gap-3 p-2 rounded-md border border-input bg-background">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, isActive: true }))}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        form.isActive !== false ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      <UserCheck size={12} /> Active
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, isActive: false }))}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        form.isActive === false ? 'bg-gray-500/10 text-gray-500 border border-gray-500/20' : 'text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      <UserX size={12} /> Inactive
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1 text-xs font-medium">
                <label>System Role</label>
                <select
                  className="w-full rounded-md border border-input bg-background p-2 text-xs"
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                >
                  <option value="staff">Staff Member</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground">Granular Permissions</label>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, permissions: allPermsSelected ? [] : availablePermissions.map(p => p.id) }))}
                    className="text-[10px] text-primary hover:underline font-medium"
                  >
                    {allPermsSelected ? 'Clear All' : 'Select All'}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-3 rounded-lg border border-border bg-secondary/10">
                  {availablePermissions.map((perm) => (
                    <label key={perm.id} className="flex items-center gap-2 text-xs cursor-pointer select-none py-0.5">
                      <input
                        type="checkbox"
                        className="rounded border-input text-primary focus:ring-ring"
                        checked={form.permissions.includes(perm.id)}
                        onChange={() => handleTogglePermission(perm.id)}
                      />
                      <span>{perm.label}</span>
                    </label>
                  ))}
                </div>
                {form.permissions.length === 0 && (
                  <p className="text-[10px] text-amber-600/90">Warning: user has no permissions selected</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingUser(null); }}
                  className="px-4 py-2 rounded-md border border-input text-xs font-medium hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-white text-black hover:bg-white/90 text-xs font-medium"
                >
                  {isAddMode ? 'Create User' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold">Delete User</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Are you sure you want to permanently delete <span className="font-medium text-foreground break-all">"{deleteConfirm.email}"</span>?
                  This action cannot be undone.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-xs text-red-500">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => { setDeleteConfirm(null); setDeleteError(''); }}
                className="px-4 py-2 rounded-md border border-input text-xs font-medium hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-600/90 text-xs font-medium"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

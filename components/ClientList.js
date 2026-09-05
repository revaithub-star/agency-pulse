'use client';

import { useState, useMemo } from 'react';
import { User, UserPlus, Edit2, Trash2, X, Mail, Phone, MapPin, Building2, Calendar, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { can } from '@/lib/permissions';

const emptyForm = {
  name: '',
  company: '',
  contact: '',
  email: '',
  address: '',
};

export default function ClientList({ clients = [], projects = [], authUser, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const canWrite = can(authUser, 'clients.write');

  const mergedClients = useMemo(() => {
    const projectStats = projects.reduce((acc, p) => {
      const clientId = p.clientId || p.client_id || null;
      const key = clientId || (p.sourceType === 'online'
        ? ((p.credentials?.[0]?.email || p.email || null) || '')
        : (p.offlinePerson || null));
      if (!key) return acc;
      if (!acc[key]) {
        acc[key] = { projectCount: 0, totalSpend: 0, lastActive: null, currency: p.currency };
      }
      acc[key].projectCount += 1;
      acc[key].totalSpend += parseFloat(p.amount) || 0;
      if (!acc[key].lastActive || new Date(p.date) > new Date(acc[key].lastActive)) {
        acc[key].lastActive = p.date;
      }
      acc[key].currency = p.currency || acc[key].currency;
      return acc;
    }, {});

    const credClients = projects.reduce((acc, p) => {
      const primaryCredential = Array.isArray(p.credentials) ? p.credentials[0] : null;
      const clientKey = p.sourceType === 'online'
        ? (primaryCredential?.email || p.email || null)
        : (p.offlinePerson || null);
      if (!clientKey) return acc;
      if (acc[clientKey]) return acc;
      acc[clientKey] = {
        id: `agg_${clientKey}`,
        name: clientKey,
        email: primaryCredential?.email || p.email || 'N/A',
        company: '',
        contact: primaryCredential?.username || p.userName || '',
        address: '',
        createdAt: p.date,
        _aggregated: true,
      };
      return acc;
    }, {});

    const merged = new Map();
    for (const c of clients) {
      const stats = projectStats[c.id] || projectStats[c.email] || { projectCount: 0, totalSpend: 0, lastActive: null, currency: 'USD' };
      merged.set(c.id, {
        ...c,
        projectCount: stats.projectCount,
        totalSpend: stats.totalSpend,
        lastActive: stats.lastActive,
        currency: stats.currency,
      });
    }
    for (const [key, c] of Object.entries(credClients)) {
      if (merged.has(c.id)) continue;
      const match = [...merged.values()].find(m => m.email && c.email && m.email.toLowerCase() === c.email.toLowerCase());
      if (match) continue;
      const stats = projectStats[key] || { projectCount: 0, totalSpend: 0, lastActive: null, currency: 'USD' };
      merged.set(c.id, {
        ...c,
        projectCount: stats.projectCount,
        totalSpend: stats.totalSpend,
        lastActive: stats.lastActive,
        currency: stats.currency,
      });
    }

    return [...merged.values()].sort((a, b) => (b.totalSpend || 0) - (a.totalSpend || 0));
  }, [clients, projects]);

  const validate = (f) => {
    const e = {};
    if (!f.name || !f.name.trim()) e.name = 'Full name is required';
    if (!f.email || !f.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Please enter a valid email address';
    return e;
  };

  const openAdd = () => {
    setEditingClient(null);
    setForm(emptyForm);
    setErrors({});
    setSubmitError('');
    setShowModal(true);
  };

  const openEdit = (client) => {
    setEditingClient(client);
    setForm({
      name: client.name || '',
      company: client.company || '',
      contact: client.contact || client.phone || '',
      email: client.email || '',
      address: client.address || '',
    });
    setErrors({});
    setSubmitError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valErrors = validate(form);
    setErrors(valErrors);
    setSubmitError('');
    if (Object.keys(valErrors).length > 0) return;

    try {
      const url = editingClient
        ? `/api/clients/${editingClient.id}`
        : '/api/clients';
      const method = editingClient ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (editingClient ? 'Failed to update client' : 'Failed to create client'));

      setShowModal(false);
      setEditingClient(null);
      setForm(emptyForm);
      if (onRefresh) onRefresh();
    } catch (err) {
      setSubmitError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await fetch(`/api/clients/${deleteConfirm.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete client');
      setDeleteConfirm(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  if (mergedClients.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
            <p className="text-muted-foreground mt-1">Active directory (0 total)</p>
          </div>
          {canWrite && (
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white text-black hover:bg-white/90 text-sm font-medium transition-colors"
            >
              <UserPlus size={16} /> Add Client
            </button>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <User size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No Clients Found</h3>
          <p className="text-muted-foreground mt-2">
            {canWrite ? 'Click "Add Client" to start building your client directory.' : 'Contact an administrator to add clients.'}
          </p>
        </div>

        {showModal && <ClientModal />}
        {deleteConfirm && <DeleteConfirm />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
          <p className="text-muted-foreground mt-1">
            Active directory ({mergedClients.length} total)
          </p>
        </div>
        {canWrite && (
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white text-black hover:bg-white/90 text-sm font-medium transition-colors"
          >
            <UserPlus size={16} /> Add Client
          </button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="w-full overflow-x-auto custom-scrollbar">
          <table className="w-full caption-bottom text-sm text-left min-w-[800px]">
            <thead className="[&_tr]:border-b [&_tr]:border-border bg-muted/20">
              <tr className="border-b border-border transition-colors">
                <th className="h-10 px-4 align-middle font-medium text-muted-foreground whitespace-nowrap">Client / Contact</th>
                <th className="h-10 px-4 align-middle font-medium text-muted-foreground whitespace-nowrap">Company</th>
                <th className="h-10 px-4 align-middle font-medium text-muted-foreground whitespace-nowrap">Email</th>
                <th className="h-10 px-4 align-middle font-medium text-muted-foreground whitespace-nowrap">Projects</th>
                <th className="h-10 px-4 align-middle font-medium text-muted-foreground whitespace-nowrap">Total Spend</th>
                <th className="h-10 px-4 align-middle font-medium text-muted-foreground whitespace-nowrap">User Since</th>
                <th className="h-10 px-4 align-middle font-medium text-muted-foreground whitespace-nowrap">Last Active</th>
                {canWrite && (
                  <th className="h-10 px-4 align-middle font-medium text-muted-foreground whitespace-nowrap text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {mergedClients.map((client) => (
                <tr key={client.id} className="border-b border-border transition-colors hover:bg-muted/30">
                  <td className="p-4 align-middle font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs shrink-0">
                        {(client.name || '??').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{client.name}</span>
                        {client.contact && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                            <Phone size={10} />{client.contact}
                          </span>
                        )}
                        {client._aggregated && (
                          <span className="text-[10px] text-muted-foreground/70 italic">from project data</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-middle text-muted-foreground">
                    {client.company ? (
                    <span className="flex items-center gap-1.5">
                      <Building2 size={12} className="opacity-70" />
                      <span className="truncate">{client.company}</span>
                    </span>
                    ) : '—'}
                  </td>
                  <td className="p-4 align-middle text-muted-foreground">
                    {client.email && client.email !== 'N/A' ? (
                      <a href={`mailto:${client.email}`} className="hover:text-primary truncate block max-w-[200px]">x
                        {client.email}
                      </a>
                    ) : '—'}
                  </td>
                  <td className="p-4 align-middle">{client.projectCount || 0}</td>
                  <td className="p-4 align-middle font-mono">
                    {formatCurrency(client.totalSpend || 0, client.currency || 'USD')}
                  </td>
                  <td className="p-4 align-middle text-muted-foreground text-xs whitespace-nowrap">
                    {client.createdAt ? (
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(client.createdAt).toLocaleDateString()}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="p-4 align-middle text-muted-foreground text-xs whitespace-nowrap">
                    {client.lastActive ? new Date(client.lastActive).toLocaleDateString() : '—'}
                  </td>
                  {canWrite && (
                    <td className="p-4 align-middle text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(client)}
                          disabled={client._aggregated}
                          title={client._aggregated ? 'Imported from project — add manually to edit' : 'Edit client'}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-foreground text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => !client._aggregated && setDeleteConfirm(client)}
                          disabled={client._aggregated || (client.projectCount && client.projectCount > 0)}
                          title={
                            client._aggregated
                              ? 'Cannot delete aggregated entry'
                              : client.projectCount > 0
                                ? `Client linked to ${client.projectCount} project(s)`
                                : 'Delete client'
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background hover:bg-red-500/10 hover:text-red-600 text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <ClientModal />}
      {deleteConfirm && <DeleteConfirm />}
    </div>
  );

  function ClientModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl space-y-4 max-h-[92vh] overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">
              {editingClient ? 'Edit Client' : 'Add New Client'}
            </h3>
            <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
          </div>

          {submitError && (
            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-xs text-red-500">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1 text-xs font-medium">
              <label>Full Name <span className="text-destructive">*</span></label>
              <input
                type="text" placeholder="John Doe"
                className={`w-full rounded-md border ${errors.name ? 'border-red-500' : 'border-input'} bg-transparent p-2 text-xs focus:ring-2 focus:ring-ring`}
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 text-xs font-medium">
                <label className="flex items-center gap-1">
                  <Building2 size={11} className="opacity-70" /> Company Name
                </label>
                <input
                  type="text" placeholder="Acme Inc."
                  className="w-full rounded-md border border-input bg-transparent p-2 text-xs focus:ring-2 focus:ring-ring"
                  value={form.company}
                  onChange={e => setForm({ ...form, company: e.target.value })}
                />
              </div>

              <div className="space-y-1 text-xs font-medium">
                <label className="flex items-center gap-1">
                  <Phone size={11} className="opacity-70" /> Contact / Phone
                </label>
                <input
                  type="text" placeholder="+1 555 0100"
                  className="w-full rounded-md border border-input bg-transparent p-2 text-xs focus:ring-2 focus:ring-ring"
                  value={form.contact}
                  onChange={e => setForm({ ...form, contact: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1 text-xs font-medium">
              <label className="flex items-center gap-1">
                <Mail size={11} className="opacity-70" /> Email Address <span className="text-destructive">*</span>
              </label>
              <input
                type="email" placeholder="client@company.com"
                className={`w-full rounded-md border ${errors.email ? 'border-red-500' : 'border-input'} bg-transparent p-2 text-xs focus:ring-2 focus:ring-ring`}
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
              {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div className="space-y-1 text-xs font-medium">
              <label className="flex items-center gap-1">
                <MapPin size={11} className="opacity-70" /> Address
              </label>
              <textarea
                rows={2}
                placeholder="Street, City, Country"
                className="w-full rounded-md border border-input bg-transparent p-2 text-xs focus:ring-2 focus:ring-ring resize-none"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button" onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-md border border-input text-xs font-medium hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-white text-black hover:bg-white/90 text-xs font-medium"
              >
                {editingClient ? 'Save Changes' : 'Create Client'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  function DeleteConfirm() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-base font-bold">Delete Client</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Are you sure you want to delete <span className="font-medium text-foreground">"{deleteConfirm.name}"</span>?
                {(deleteConfirm.projectCount || 0) > 0 && (
                  <span className="block mt-1 text-red-500 font-medium">
                    This client is linked to {deleteConfirm.projectCount} project(s) and cannot be deleted.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 rounded-md border border-input text-xs font-medium hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={(deleteConfirm.projectCount || 0) > 0}
              className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-600/90 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }
}

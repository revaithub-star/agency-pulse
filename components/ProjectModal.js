'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { getGlobalCurrency } from '@/lib/currency';

function PasswordInput({ value, onChange, placeholder, className = '', iconSize = 14 }) {
    const [showPassword, setShowPassword] = useState(false);
    const paddingRightClass = iconSize >= 16 ? 'pr-9' : 'pr-8';

    return (
        <div className="relative w-full">
            <input
                type={showPassword ? 'text' : 'password'}
                className={`${className} ${paddingRightClass}`}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 inset-2 z-10 flex -translate-y-1/2 items-center justify-center p-1 text-muted-foreground hover:text-foreground"
                style={{
                    right: "10px",
                }}
                tabIndex={-1}
                title={showPassword ? "Hide password" : "Show password"}
            >
                {showPassword ? <EyeOff size={iconSize} /> : <Eye size={iconSize} />}
            </button>
        </div>
    );
}

function getDefaultFormData() {
    return {
        projectName: '',
        projectUrl: '',
        sourceType: 'online',
        onlinePlatform: 'Freelance',
        onlinePlatformOther: '',
        offlinePerson: '',
        clientId: '',
        date: new Date().toISOString().split('T')[0],
        status: 'In Progress',
        startDate: '',
        endDate: '',
        statusReason: '',
        amount: '',
        budget: '',
        currency: getGlobalCurrency(),
        category: '',
        notes: '',
        includeCredentials: false,
        credentials: [{ serviceName: '', username: '', email: '', password: '', url: '' }],
        includeHosting: false,
        hostingDetails: {
            server: { serverName: '', ip: '', username: '', password: '', notes: '' },
            hosting: { provider: '', plan: '', domain: '', username: '', password: '', notes: '' },
            domain: { registrar: '', domainName: '', expiryDate: '', username: '', password: '', nameservers: '', notes: '' },
        },
    };
}

function getInitialFormData(editingProject) {
    const defaultFormData = getDefaultFormData();
    if (!editingProject) return defaultFormData;

    const hasCreds = Array.isArray(editingProject.credentials) && editingProject.credentials.some(c => c.serviceName || c.username || c.email || c.password || c.url);
    const hasHosting = editingProject.hostingDetails && (
        Object.values(editingProject.hostingDetails.server || {}).some(v => v) ||
        Object.values(editingProject.hostingDetails.hosting || {}).some(v => v) ||
        Object.values(editingProject.hostingDetails.domain || {}).some(v => v)
    );

    const migrated = {
        ...defaultFormData,
        ...editingProject,
        currency: getGlobalCurrency(),
        includeCredentials: hasCreds,
        includeHosting: hasHosting,
        credentials: (hasCreds && Array.isArray(editingProject.credentials) && editingProject.credentials.length > 0)
            ? editingProject.credentials
            : [{ serviceName: '', username: '', email: '', password: '', url: '' }],
        hostingDetails: {
            server: { ...defaultFormData.hostingDetails.server, ...(editingProject.hostingDetails?.server || {}) },
            hosting: { ...defaultFormData.hostingDetails.hosting, ...(editingProject.hostingDetails?.hosting || {}) },
            domain: { ...defaultFormData.hostingDetails.domain, ...(editingProject.hostingDetails?.domain || {}) },
        },
    };

    if (!migrated.onlinePlatformOther && editingProject.onlinePlatform && !['Freelance', 'Fiverr', 'Upwork', 'LinkedIn', 'Other'].includes(editingProject.onlinePlatform)) {
        migrated.onlinePlatformOther = editingProject.onlinePlatform;
        migrated.onlinePlatform = 'Other';
    }

    if (!editingProject.credentials && (editingProject.userName || editingProject.email || editingProject.password)) {
        migrated.credentials = [{
            serviceName: '',
            username: editingProject.userName || '',
            email: editingProject.email || '',
            password: editingProject.password || '',
            url: '',
        }];
        migrated.includeCredentials = true;
    }

    return migrated;
}

function ProjectModalContent({ isOpen, onClose, onSubmit, editingProject, categories, clients }) {
    const [formData, setFormData] = useState(() => getInitialFormData(editingProject));
    const [errors, setErrors] = useState({});
    const [hostingSectionOpen, setHostingSectionOpen] = useState({ server: true, hosting: true, domain: true });

    useEffect(() => {
        const syncCurrency = () => {
            if (!editingProject) {
                setFormData((prev) => ({ ...prev, currency: getGlobalCurrency() }));
            }
        };

        window.addEventListener('agency_branding_updated', syncCurrency);
        return () => window.removeEventListener('agency_branding_updated', syncCurrency);
    }, [editingProject]);

    const addCredential = () => {
        setFormData({
            ...formData,
            credentials: [...formData.credentials, { serviceName: '', username: '', email: '', password: '', url: '' }]
        });
    };

    const removeCredential = (index) => {
        const newCredentials = formData.credentials.filter((_, i) => i !== index);
        setFormData({ ...formData, credentials: newCredentials });
    };

    const updateCredential = (index, field, value) => {
        const newCredentials = [...formData.credentials];
        newCredentials[index] = { ...newCredentials[index], [field]: value };
        setFormData({ ...formData, credentials: newCredentials });
    };

    const updateServerDetail = (field, value) => {
        setFormData({
            ...formData,
            hostingDetails: { ...formData.hostingDetails, server: { ...formData.hostingDetails.server, [field]: value } }
        });
    };

    const updateHostingAccount = (field, value) => {
        setFormData({
            ...formData,
            hostingDetails: { ...formData.hostingDetails, hosting: { ...formData.hostingDetails.hosting, [field]: value } }
        });
    };

    const updateDomainDetail = (field, value) => {
        setFormData({
            ...formData,
            hostingDetails: { ...formData.hostingDetails, domain: { ...formData.hostingDetails.domain, [field]: value } }
        });
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.projectName?.trim()) {
            newErrors.projectName = 'Project name is required';
        }
        if (!formData.date) {
            newErrors.date = 'Date is required';
        }
        if (formData.status === 'In Progress' || formData.status === 'Completed' || formData.status === 'On Hold' || formData.status === 'Cancelled') {
            if (!formData.startDate) {
                newErrors.startDate = 'Start date is required';
            }
        }
        if (formData.status === 'In Progress') {
            if (!formData.endDate) {
                newErrors.endDate = 'Expected completion date is required';
            }
        }
        if (formData.status === 'Completed') {
            if (!formData.endDate) {
                newErrors.endDate = 'End date is required';
            }
        }
        if (formData.status === 'On Hold' || formData.status === 'Cancelled') {
            if (!formData.statusReason?.trim()) {
                newErrors.statusReason = formData.status === 'On Hold'
                    ? 'A reason is required when a project is on hold'
                    : 'A reason is required when a project is cancelled';
            }
        }
        if (formData.sourceType === 'offline' && !formData.clientId && !formData.offlinePerson?.trim()) {
            newErrors.clientId = 'Please select a client or enter client / person name';
        }
        if (formData.sourceType === 'online' && formData.onlinePlatform === 'Other' && !formData.onlinePlatformOther?.trim()) {
            newErrors.onlinePlatformOther = 'Please specify the platform name';
        }
        if (formData.projectUrl && !/^https?:\/\//i.test(formData.projectUrl)) {
            newErrors.projectUrl = 'Project URL must start with http:// or https://';
        }
        if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
            newErrors.endDate = 'End date cannot be earlier than start date';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;

        const submitData = { ...formData };
        if (formData.sourceType === 'online' && formData.onlinePlatform === 'Other' && formData.onlinePlatformOther?.trim()) {
            submitData.onlinePlatform = formData.onlinePlatformOther.trim();
        }
        delete submitData.onlinePlatformOther;
        if (!submitData.includeCredentials) {
            submitData.credentials = [];
        }
        if (!submitData.includeHosting) {
            submitData.hostingDetails = {
                server: { serverName: '', ip: '', username: '', password: '', notes: '' },
                hosting: { provider: '', plan: '', domain: '', username: '', password: '', notes: '' },
                domain: { registrar: '', domainName: '', expiryDate: '', username: '', password: '', nameservers: '', notes: '' },
            };
        }
        onSubmit(submitData);
    };

    const showStatusDates = formData.status === 'In Progress' || formData.status === 'Completed';
    const showStartDate = showStatusDates || formData.status === 'On Hold' || formData.status === 'Cancelled';
    const showReason = formData.status === 'On Hold' || formData.status === 'Cancelled';

    const categoryOptions = Array.isArray(categories) ? categories : [];
    const clientOptions = Array.isArray(clients) ? clients : [];
    const platformOptions = ['Freelance', 'Fiverr', 'Upwork', 'LinkedIn', 'Other'];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-background/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-2xl rounded-xl border border-border bg-card p-0 shadow-lg flex flex-col max-h-[92vh]"
                >
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border shrink-0">
                        <div>
                            <h2 className="text-lg sm:text-xl font-semibold tracking-tight">
                                {editingProject ? 'Edit Project' : 'New Project Entry'}
                            </h2>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                Enter complete project details for your local records.
                            </p>
                        </div>
                        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                        <form id="projectForm" onSubmit={handleSubmit} className="space-y-6">

                            {/* Primary Details */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2 sm:col-span-2">
                                        <label className="text-sm font-medium">
                                            Project Name <span className="text-destructive">*</span>
                                        </label>
                                        <input
                                            className={`flex h-10 w-full rounded-md border ${errors.projectName ? 'border-destructive' : 'border-input'} bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
                                            placeholder="Enter project name"
                                            value={formData.projectName}
                                            onChange={e => setFormData({ ...formData, projectName: e.target.value })}
                                        />
                                        {errors.projectName && (
                                            <p className="text-xs text-destructive">{errors.projectName}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Project Status <span className="text-destructive">*</span>
                                        </label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="In Progress">In Progress</option>
                                            <option value="Completed">Completed</option>
                                            <option value="On Hold">On Hold</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Record Date <span className="text-destructive">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            className={`flex h-10 w-full rounded-md border ${errors.date ? 'border-destructive' : 'border-input'} bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        />
                                        {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Status-based conditional fields */}
                            <div className="space-y-4 rounded-lg border border-border bg-secondary/10 p-4">
                                <h3 className="text-sm font-semibold">Project Timeline</h3>
                                {showStartDate && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-muted-foreground uppercase">
                                                Start Date <span className="text-destructive">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                className={`flex h-9 w-full rounded-md border ${errors.startDate ? 'border-destructive' : 'border-input'} bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
                                                value={formData.startDate}
                                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                            />
                                            {errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}
                                        </div>
                                        {showStatusDates && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-muted-foreground uppercase">
                                                    {formData.status === 'In Progress' ? 'Expected Completion' : 'End Date'} <span className="text-destructive">*</span>
                                                </label>
                                                <input
                                                    type="date"
                                                    className={`flex h-9 w-full rounded-md border ${errors.endDate ? 'border-destructive' : 'border-input'} bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
                                                    value={formData.endDate}
                                                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                                />
                                                {errors.endDate && <p className="text-xs text-destructive">{errors.endDate}</p>}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {showReason && (
                                    <div className="space-y-2 pt-2">
                                        <label className="text-xs font-medium text-muted-foreground uppercase">
                                            {formData.status === 'On Hold' ? 'Reason (On Hold)' : 'Reason (Cancelled)'} <span className="text-destructive">*</span>
                                        </label>
                                        <textarea
                                            className={`flex w-full rounded-md border ${errors.statusReason ? 'border-destructive' : 'border-input'} bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[70px]`}
                                            placeholder={formData.status === 'On Hold'
                                                ? 'Explain why the project is on hold...'
                                                : 'Explain why the project was cancelled...'
                                            }
                                            value={formData.statusReason}
                                            onChange={e => setFormData({ ...formData, statusReason: e.target.value })}
                                        />
                                        {errors.statusReason && <p className="text-xs text-destructive">{errors.statusReason}</p>}
                                    </div>
                                )}
                            </div>

                            {/* Project Source (moved up) */}
                            <div className="space-y-4">
                                <label className="text-sm font-medium">Project Source</label>
                                <div className="flex gap-0 rounded-md border border-input p-1">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, sourceType: 'online' })}
                                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-sm transition-all ${formData.sourceType === 'online' ? 'bg-secondary text-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary/50'
                                            }`}
                                    >
                                        Online
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, sourceType: 'offline' })}
                                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-sm transition-all ${formData.sourceType === 'offline' ? 'bg-secondary text-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary/50'
                                            }`}
                                    >
                                        Offline
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {formData.sourceType === 'online' ? (
                                        <div className="space-y-2 sm:col-span-2">
                                            <label className="text-sm font-medium">Platform</label>
                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                value={formData.onlinePlatform}
                                                onChange={e => setFormData({ ...formData, onlinePlatform: e.target.value })}
                                            >
                                                {platformOptions.map(p => (
                                                    <option key={p} value={p}>{p === 'Freelance' ? 'Freelance.com' : p}</option>
                                                ))}
                                            </select>
                                            {formData.onlinePlatform === 'Other' && (
                                                <div className="pt-2">
                                                    <input
                                                        className={`flex h-10 w-full rounded-md border ${errors.onlinePlatformOther ? 'border-destructive' : 'border-input'} bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
                                                        placeholder="Enter platform name"
                                                        value={formData.onlinePlatformOther}
                                                        onChange={e => setFormData({ ...formData, onlinePlatformOther: e.target.value })}
                                                    />
                                                    {errors.onlinePlatformOther && (
                                                        <p className="text-xs text-destructive pt-1">{errors.onlinePlatformOther}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4 sm:col-span-2">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">
                                                    Client <span className="text-destructive">*</span>
                                                </label>
                                                <select
                                                    className={`flex h-10 w-full rounded-md border ${errors.clientId ? 'border-destructive' : 'border-input'} bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
                                                    value={formData.clientId || ''}
                                                    onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                                                >
                                                    <option value="">Select a client...</option>
                                                    {clientOptions.map(client => (
                                                        <option key={client.id} value={client.id}>
                                                            {client.name}{client.company ? ` (${client.company})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.clientId && <p className="text-xs text-destructive">{errors.clientId}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Referral Person / Name (optional)</label>
                                                <input
                                                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                    placeholder="e.g. John Smith"
                                                    value={formData.offlinePerson}
                                                    onChange={e => setFormData({ ...formData, offlinePerson: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Client Credentials Checkbox */}
                            <div className="space-y-3 rounded-lg border border-border p-4">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                                        checked={formData.includeCredentials}
                                        onChange={e => setFormData({ ...formData, includeCredentials: e.target.checked })}
                                    />
                                    <span className="text-sm font-semibold">Client Credentials</span>
                                </label>

                                {formData.includeCredentials && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground">Store login and access credentials</span>
                                            <button
                                                type="button"
                                                onClick={addCredential}
                                                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                            >
                                                <Plus size={14} /> Add Entry
                                            </button>
                                        </div>

                                        {formData.credentials.map((cred, index) => (
                                            <div key={index} className="space-y-3 pt-3 first:pt-0 border-t first:border-0 border-border/50">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold text-muted-foreground">Credential #{index + 1}</span>
                                                    {formData.credentials.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeCredential(index)}
                                                            className="text-destructive hover:text-destructive/80"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div className="space-y-1 sm:col-span-2">
                                                        <label className="text-xs font-medium text-muted-foreground uppercase">Credential / Service Name</label>
                                                        <input
                                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                            placeholder="e.g. cPanel, WordPress Admin, FTP"
                                                            value={cred.serviceName}
                                                            onChange={e => updateCredential(index, 'serviceName', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-medium text-muted-foreground uppercase">Username</label>
                                                        <input
                                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                            value={cred.username}
                                                            onChange={e => updateCredential(index, 'username', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-medium text-muted-foreground uppercase">Email</label>
                                                        <input
                                                            type="email"
                                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                            value={cred.email}
                                                            onChange={e => updateCredential(index, 'email', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1 sm:col-span-2">
                                                        <label className="text-xs font-medium text-muted-foreground uppercase">Password / Key</label>
                                                        <PasswordInput
                                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
                                                            placeholder="Stored securely"
                                                            value={cred.password}
                                                            onChange={e => updateCredential(index, 'password', e.target.value)}
                                                            iconSize={16}
                                                        />
                                                    </div>
                                                    <div className="space-y-1 sm:col-span-2">
                                                        <label className="text-xs font-medium text-muted-foreground uppercase">URL / Details</label>
                                                        <input
                                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                            placeholder="e.g. https://domain.com/login"
                                                            value={cred.url}
                                                            onChange={e => updateCredential(index, 'url', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Hosting / Server Details Checkbox */}
                            <div className="space-y-3 rounded-lg border border-border bg-primary/5 p-4">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                                        checked={formData.includeHosting}
                                        onChange={e => setFormData({ ...formData, includeHosting: e.target.checked })}
                                    />
                                    <span className="text-sm font-semibold">Hosting / Server Details</span>
                                </label>

                                {formData.includeHosting && (
                                    <div className="space-y-4 pt-2">
                                        {/* Server Details Section */}
                                        <div className="rounded-md border border-border/60 overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => setHostingSectionOpen(s => ({ ...s, server: !s.server }))}
                                                className="w-full flex items-center justify-between px-3 py-2 bg-secondary/30 hover:bg-secondary/50 transition-colors"
                                            >
                                                <span className="text-xs font-bold uppercase tracking-wide">Server Details</span>
                                                {hostingSectionOpen.server ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </button>
                                            {hostingSectionOpen.server && (
                                                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-medium text-muted-foreground uppercase">Server Name / Provider</label>
                                                        <input
                                                            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                            placeholder="e.g. Hostinger, DigitalOcean"
                                                            value={formData.hostingDetails.server.serverName}
                                                            onChange={e => updateServerDetail('serverName', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-medium text-muted-foreground uppercase">IP Address</label>
                                                        <input
                                                            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                            placeholder="0.0.0.0"
                                                            value={formData.hostingDetails.server.ip}
                                                            onChange={e => updateServerDetail('ip', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-medium text-muted-foreground uppercase">Username</label>
                                                        <input
                                                            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                            value={formData.hostingDetails.server.username}
                                                            onChange={e => updateServerDetail('username', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-medium text-muted-foreground uppercase">Password</label>
                                                        <PasswordInput
                                                            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                            value={formData.hostingDetails.server.password}
                                                            onChange={e => updateServerDetail('password', e.target.value)}
                                                            iconSize={14}
                                                        />
                                                    </div>
                                                    <div className="space-y-1 sm:col-span-2">
                                                        <label className="text-[10px] font-medium text-muted-foreground uppercase">Server Notes</label>
                                                        <input
                                                            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                            placeholder="SSH port, key details, special access..."
                                                            value={formData.hostingDetails.server.notes}
                                                            onChange={e => updateServerDetail('notes', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Hosting Account Details Section */}
                                        <div className="rounded-md border border-border/60 overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => setHostingSectionOpen(s => ({ ...s, hosting: !s.hosting }))}
                                                className="w-full flex items-center justify-between px-3 py-2 bg-secondary/30 hover:bg-secondary/50 transition-colors"
                                            >
                                                <span className="text-xs font-bold uppercase tracking-wide">Hosting Account Details</span>
                                                {hostingSectionOpen.hosting ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </button>
                                            {hostingSectionOpen.hosting && (
                                                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-medium text-muted-foreground uppercase">Hosting Provider</label>
                                                        <input
                                                            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                            placeholder="e.g. Namecheap, GoDaddy"
                                                            value={formData.hostingDetails.hosting.provider}
                                                            onChange={e => updateHostingAccount('provider', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-medium text-muted-foreground uppercase">Plan / Package</label>
                                                        <input
                                                            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                            placeholder="e.g. Shared Basic, VPS Pro"
                                                            value={formData.hostingDetails.hosting.plan}
                                                            onChange={e => updateHostingAccount('plan', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-medium text-muted-foreground uppercase">Domain Name</label>
                                                        <input
                                                            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                            placeholder="e.g. mydomain.com"
                                                            value={formData.hostingDetails.hosting.domain}
                                                            onChange={e => updateHostingAccount('domain', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-medium text-muted-foreground uppercase">Username</label>
                                                        <input
                                                            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                            value={formData.hostingDetails.hosting.username}
                                                            onChange={e => updateHostingAccount('username', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1 sm:col-span-2">
                                                        <label className="text-[10px] font-medium text-muted-foreground uppercase">Password</label>
                                                        <PasswordInput
                                                            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                            value={formData.hostingDetails.hosting.password}
                                                            onChange={e => updateHostingAccount('password', e.target.value)}
                                                            iconSize={14}
                                                        />
                                                    </div>
                                                    <div className="space-y-1 sm:col-span-2">
                                                        <label className="text-[10px] font-medium text-muted-foreground uppercase">Hosting Notes</label>
                                                        <input
                                                            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                            placeholder="Renewal date, billing cycle, nameservers..."
                                                            value={formData.hostingDetails.hosting.notes}
                                                            onChange={e => updateHostingAccount('notes', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Domain Details Section */}
                                        <div className="rounded-md border border-border/60 overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => setHostingSectionOpen(s => ({ ...s, domain: !s.domain }))}
                                                className="w-full flex items-center justify-between px-3 py-2 bg-secondary/30 hover:bg-secondary/50 transition-colors"
                                            >
                                                <span className="text-xs font-bold uppercase tracking-wide">Domain Details</span>
                                                {hostingSectionOpen.domain ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </button>
                                            {hostingSectionOpen.domain && (
                                                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-medium text-muted-foreground uppercase">Domain Registrar / Provider</label>
                                                        <input
                                                            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                            placeholder="e.g. Namecheap, GoDaddy, Cloudflare"
                                                            value={formData.hostingDetails.domain?.registrar || ''}
                                                            onChange={e => updateDomainDetail('registrar', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-medium text-muted-foreground uppercase">Domain Name</label>
                                                        <input
                                                            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                            placeholder="e.g. example.com"
                                                            value={formData.hostingDetails.domain?.domainName || ''}
                                                            onChange={e => updateDomainDetail('domainName', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-medium text-muted-foreground uppercase">Expiry / Renewal Date</label>
                                                        <input
                                                            type="date"
                                                            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                            value={formData.hostingDetails.domain?.expiryDate || ''}
                                                            onChange={e => updateDomainDetail('expiryDate', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-medium text-muted-foreground uppercase">Username / Email</label>
                                                        <input
                                                            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                            placeholder="e.g. admin@example.com"
                                                            value={formData.hostingDetails.domain?.username || ''}
                                                            onChange={e => updateDomainDetail('username', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-medium text-muted-foreground uppercase">Password / Auth Key</label>
                                                        <PasswordInput
                                                            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                            value={formData.hostingDetails.domain?.password || ''}
                                                            onChange={e => updateDomainDetail('password', e.target.value)}
                                                            iconSize={14}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-medium text-muted-foreground uppercase">Nameservers / DNS</label>
                                                        <input
                                                            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                            placeholder="ns1.provider.com, ns2.provider.com"
                                                            value={formData.hostingDetails.domain?.nameservers || ''}
                                                            onChange={e => updateDomainDetail('nameservers', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1 sm:col-span-2">
                                                        <label className="text-[10px] font-medium text-muted-foreground uppercase">Domain Notes</label>
                                                        <input
                                                            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                            placeholder="Auto-renewal status, transfer auth code, special notes..."
                                                            value={formData.hostingDetails.domain?.notes || ''}
                                                            onChange={e => updateDomainDetail('notes', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Financials & Category */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2 sm:col-span-2">
                                    <label className="text-sm font-medium">
                                        Project Amount <span className="text-destructive">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="flex h-10 w-24 shrink-0 items-center justify-center rounded-md border border-input bg-muted/40 px-2 py-2 text-sm font-mono text-foreground">
                                            {formData.currency || getGlobalCurrency()}
                                        </div>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            placeholder="0.00"
                                            value={formData.amount}
                                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Category</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="">Select category...</option>
                                        {categoryOptions.map(cat => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2 sm:col-span-1">
                                    <label className="text-sm font-medium">Budget (optional)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="0.00"
                                        value={formData.budget}
                                        onChange={e => setFormData({ ...formData, budget: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 sm:col-span-1">
                                    <label className="text-sm font-medium">Project URL</label>
                                    <input
                                        className={`flex h-10 w-full rounded-md border ${errors.projectUrl ? 'border-destructive' : 'border-input'} bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
                                        placeholder="https://example.com"
                                        value={formData.projectUrl}
                                        onChange={e => setFormData({ ...formData, projectUrl: e.target.value })}
                                    />
                                    {errors.projectUrl && <p className="text-xs text-destructive">{errors.projectUrl}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Notes</label>
                                <textarea
                                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px]"
                                    placeholder="Any additional details..."
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                        </form>
                    </div>

                    <div className="p-4 sm:p-6 border-t border-border flex justify-end gap-3 bg-secondary/10 rounded-b-xl shrink-0">
                        <button type="button" onClick={onClose} className="app-button app-button-secondary">
                            Cancel
                        </button>
                        <button form="projectForm" type="submit" className="app-button app-button-primary">
                            Save Record
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

export default function ProjectModal(props) {
    const editKey = props.editingProject?.id || props.editingProject?.projectName || 'new';
    return <ProjectModalContent key={`${props.isOpen}-${editKey}`} {...props} />;
}

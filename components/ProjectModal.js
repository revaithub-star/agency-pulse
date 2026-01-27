'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function ProjectModal({ isOpen, onClose, onSubmit, editingProject }) {
    const [formData, setFormData] = useState({
        projectName: '',
        userName: '',
        email: '',
        password: '',
        sourceType: 'online', // 'online' | 'offline'
        onlinePlatform: 'Freelance',
        offlinePerson: '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        category: 'Landing Page',
        notes: '',
        status: 'In Progress'
    });

    const defaultFormData = {
        projectName: '',
        userName: '',
        email: '',
        password: '',
        sourceType: 'online',
        onlinePlatform: 'Freelance',
        offlinePerson: '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        category: 'Landing Page',
        notes: '',
        status: 'In Progress'
    };

    useEffect(() => {
        if (!isOpen) return;

        if (editingProject) {
            // Merge editing project with defaults to ensure all fields are defined
            setFormData({
                ...defaultFormData,
                ...editingProject,
                // Ensure no null/undefined values leak into state
                email: editingProject.email || '',
                password: editingProject.password || '',
                offlinePerson: editingProject.offlinePerson || '',
                notes: editingProject.notes || '',
            });
        } else {
            setFormData(defaultFormData);
        }
    }, [editingProject, isOpen]);


    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-2xl rounded-xl border border-border bg-card p-0 shadow-lg flex flex-col max-h-[90vh]"
                >
                    <div className="flex items-center justify-between p-6 border-b border-border">
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight">
                                {editingProject ? 'Edit Project' : 'New Project Entry'}
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Enter complete project details for your local records.
                            </p>
                        </div>
                        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto custom-scrollbar">
                        <form id="projectForm" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-6">

                            {/* Primary Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Project Name</label>
                                    <input
                                        required
                                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="e.g. E-commerce Redesign"
                                        value={formData.projectName}
                                        onChange={e => setFormData({ ...formData, projectName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Status</label>
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
                            </div>

                            {/* Client & Credentials */}
                            <div className="space-y-4 rounded-lg border border-border bg-secondary/20 p-4">
                                <h3 className="text-sm font-semibold flex items-center gap-2">Client Credentials</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-muted-foreground uppercase">Username</label>
                                        <input
                                            required
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            value={formData.userName}
                                            onChange={e => setFormData({ ...formData, userName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-muted-foreground uppercase">Email</label>
                                        <input
                                            type="email"
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-xs font-medium text-muted-foreground uppercase">Password / Key</label>
                                        <input
                                            type="text"
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
                                            placeholder="Stored locally only"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Source Logic */}
                            <div className="space-y-4">
                                <label className="text-sm font-medium">Project Source</label>
                                <div className="flex gap-0 rounded-md border border-input p-1">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, sourceType: 'online' })}
                                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-sm transition-all ${formData.sourceType === 'online' ? 'bg-secondary text-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary/50'
                                            }`}
                                    >
                                        Online (Fiverr/Freelance)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, sourceType: 'offline' })}
                                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-sm transition-all ${formData.sourceType === 'offline' ? 'bg-secondary text-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary/50'
                                            }`}
                                    >
                                        Offline (Direct)
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                    {formData.sourceType === 'online' ? (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Platform</label>
                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                value={formData.onlinePlatform}
                                                onChange={e => setFormData({ ...formData, onlinePlatform: e.target.value })}
                                            >
                                                <option value="Freelance">Freelance.com</option>
                                                <option value="Fiverr">Fiverr</option>
                                                <option value="Upwork">Upwork</option>
                                                <option value="LinkedIn">LinkedIn</option>
                                                <option value="Other">Other</option>
                                            </select>

                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Referral Person / Name</label>
                                            <input
                                                required
                                                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                placeholder="e.g. John Smith"
                                                value={formData.offlinePerson}
                                                onChange={e => setFormData({ ...formData, offlinePerson: e.target.value })}
                                            />
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Date</label>
                                        <input
                                            required type="date"
                                            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Financials & Category */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Amount (INR)</label>
                                    <input
                                        required type="number"
                                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Category</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="Landing Page">Landing Page</option>
                                        <option value="WooCommerce">WooCommerce</option>
                                        <option value="Corporate Site">Corporate Site</option>
                                        <option value="SaaS Dashboard">SaaS Dashboard</option>
                                        <option value="Bug Fix">Bug Fix</option>
                                        <option value="Other">Other</option>
                                    </select>
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

                    <div className="p-6 border-t border-border flex justify-end gap-3 bg-secondary/10 rounded-b-xl">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border border-input bg-background hover:bg-secondary text-sm font-medium transition-colors">
                            Cancel
                        </button>
                        <button form="projectForm" type="submit" className="px-6 py-2 rounded-md bg-foreground text-background hover:opacity-90 text-sm font-medium transition-colors">
                            Save Record
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

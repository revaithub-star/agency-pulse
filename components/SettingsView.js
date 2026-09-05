'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, Shield, Database, Trash2, Key, Check, Info, Sliders, Upload } from 'lucide-react';

export default function SettingsView({ theme, onToggleTheme, authUser, onUpdateBranding }) {
    const displayName = authUser?.name || authUser?.userName || authUser?.email?.split('@')[0] || 'Admin';

    const [agencyName, setAgencyName] = useState('Agency Pulse');
    const [defaultCurrency, setDefaultCurrency] = useState('USD');
    const [agencyLogo, setAgencyLogo] = useState(null);
    const [savedNotice, setSavedNotice] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState({ text: '', isError: false });
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

    useEffect(() => {
        const name = localStorage.getItem('agency_pulse_name');
        const curr = localStorage.getItem('agency_pulse_currency');
        const logo = localStorage.getItem('agency_pulse_logo');
        if (name) setAgencyName(name);
        if (curr) setDefaultCurrency(curr);
        if (logo) setAgencyLogo(logo);
    }, []);

    const handleLogoUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert('File size exceeds 5MB limit. Please select a smaller image.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const targetDim = 200;
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > targetDim) {
                        height = Math.round((height * targetDim) / width);
                        width = targetDim;
                    }
                } else {
                    if (height > targetDim) {
                        width = Math.round((width * targetDim) / height);
                        height = targetDim;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const resizedDataUrl = canvas.toDataURL('image/png');
                setAgencyLogo(resizedDataUrl);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveLogo = () => {
        setAgencyLogo(null);
    };

    const handleSaveGeneral = (e) => {
        e.preventDefault();
        localStorage.setItem('agency_pulse_name', agencyName);
        localStorage.setItem('agency_pulse_currency', defaultCurrency);
        if (agencyLogo) {
            localStorage.setItem('agency_pulse_logo', agencyLogo);
        } else {
            localStorage.removeItem('agency_pulse_logo');
        }
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 3000);

        if (onUpdateBranding) {
            onUpdateBranding({ name: agencyName, logo: agencyLogo, currency: defaultCurrency });
        }
        window.dispatchEvent(new CustomEvent('agency_branding_updated', {
            detail: { name: agencyName, logo: agencyLogo }
        }));
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (!newPassword || newPassword.length < 8) {
            setPasswordMessage({ text: 'New password must be at least 8 characters.', isError: true });
            return;
        }
        setIsSubmittingPassword(true);
        setPasswordMessage({ text: '', isError: false });

        try {
            const res = await fetch('/api/users/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update password');

            setPasswordMessage({ text: 'Password successfully updated!', isError: false });
            setCurrentPassword('');
            setNewPassword('');
        } catch (err) {
            setPasswordMessage({ text: err.message, isError: true });
        } finally {
            setIsSubmittingPassword(false);
        }
    };

    const handleResetAllData = async () => {
        if (confirm('CRITICAL WARNING: This will permanently delete all projects, clients, payments, and expenses from your SQLite database. Are you absolutely sure?')) {
            try {
                const res = await fetch('/api/projects/reset-data', { method: 'POST' });
                if (res.ok) {
                    alert('All project and financial data has been completely cleared.');
                    window.location.reload();
                } else {
                    const data = await res.json();
                    alert(`Reset failed: ${data.error || 'Unknown error'}`);
                }
            } catch (err) {
                alert(`Error: ${err.message}`);
            }
        }
    };

    return (
        <div className="space-y-8 max-w-4xl">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
                <p className="text-muted-foreground mt-1">
                    Manage system preferences, appearance, security, and workspace settings.
                </p>
            </div>

            {/* Appearance / Theme Toggle */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-4">
                    <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            {theme === 'dark' ? <Moon size={20} className="text-purple-400" /> : <Sun size={20} className="text-amber-500" />}
                            Interface Appearance
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Switch between dark mode and light mode interface styles.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-secondary p-1 rounded-lg border border-border">
                        <button
                            type="button"
                            onClick={() => onToggleTheme('light')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${theme === 'light' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Sun size={14} /> Light
                        </button>
                        <button
                            type="button"
                            onClick={() => onToggleTheme('dark')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${theme === 'dark' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Moon size={14} /> Dark
                        </button>
                    </div>
                </div>
            </div>

            {/* Agency General Settings — Admin Only */}
            {authUser?.role === 'admin' && (
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-4">
                        <div>
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Sliders size={20} className="text-blue-500" />
                                Agency & Project Profile
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Customize project name, upload workspace logo with fixed sizing, and select default currency.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSaveGeneral} className="space-y-6">
                        {/* Logo Upload Field */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium block text-foreground">
                                Project / Workspace Logo
                            </label>
                            <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-secondary/20">
                                {/* Fixed Size Logo Preview Box */}
                                <div className="relative group shrink-0">
                                    <div className="w-14 h-14 rounded-xl border border-border bg-card flex items-center justify-center overflow-hidden shadow-sm p-1">
                                        {agencyLogo ? (
                                            <img
                                                src={agencyLogo}
                                                alt="Workspace Logo Preview"
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <img
                                                src="/AgencyPulseLogo.png"
                                                alt="Default Logo"
                                                className="w-full h-full object-contain opacity-70"
                                            />
                                        )}
                                    </div>
                                    <span className="absolute -bottom-1 -right-1 bg-primary text-[9px] font-bold text-primary-foreground px-1 py-0.5 rounded shadow-sm">
                                        40×40
                                    </span>
                                </div>

                                <div className="space-y-1.5 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <label
                                            htmlFor="logo-upload-input"
                                            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium border border-border transition-colors shadow-sm"
                                        >
                                            <Upload size={14} />
                                            <span>Upload Logo</span>
                                        </label>
                                        <input
                                            id="logo-upload-input"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            className="hidden"
                                        />
                                        {agencyLogo && (
                                            <button
                                                type="button"
                                                onClick={handleRemoveLogo}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors"
                                            >
                                                <Trash2 size={13} />
                                                <span>Reset Logo</span>
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        Uploaded image is processed and displayed with a fixed dimension of 40×40 px on top of sidebar.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1 text-xs font-medium">
                                <label className="text-foreground">Agency / Business Name</label>
                                <input
                                    type="text"
                                    value={agencyName}
                                    onChange={(e) => setAgencyName(e.target.value)}
                                    className="w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm focus:ring-2 focus:ring-ring text-foreground"
                                />
                            </div>
                            <div className="space-y-1 text-xs font-medium">
                                <label className="text-foreground">Default Currency</label>
                                <select
                                    value={defaultCurrency}
                                    onChange={(e) => setDefaultCurrency(e.target.value)}
                                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-ring text-foreground"
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="INR">INR (₹)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="CAD">CAD ($)</option>
                                    <option value="AUD">AUD ($)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="submit"
                                className="inline-flex h-10 items-center gap-2 rounded-md border border-primary bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            >
                                <Check size={15} />
                                Save Preferences
                            </button>
                            {savedNotice && (
                                <span className="text-xs text-green-500 flex items-center gap-1 font-medium">
                                    <Check size={14} /> Saved successfully! Logo & name updated on sidebar.
                                </span>
                            )}
                        </div>
                    </form>
                </div>
            )}

            {/* Account Security */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-4">
                    <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Key size={20} className="text-amber-500" />
                            Account Security
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Update your login credentials ({authUser?.email || 'Admin'}).
                        </p>
                    </div>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-full">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1 text-xs font-medium">
                            <label htmlFor="account-name">User Name</label>
                            <input
                                id="account-name"
                                type="text"
                                value={displayName}
                                readOnly
                                className="w-full h-10 rounded-md border border-input bg-secondary/40 px-3 text-sm text-foreground cursor-not-allowed"
                            />
                        </div>
                        <div className="space-y-1 text-xs font-medium">
                            <label htmlFor="account-email">Email</label>
                            <input
                                id="account-email"
                                type="email"
                                value={authUser?.email || ''}
                                readOnly
                                className="w-full h-10 rounded-md border border-input bg-secondary/40 px-3 text-sm text-foreground cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1 text-xs font-medium">
                            <label htmlFor="current-password">Current Password</label>
                            <input
                                id="current-password"
                                type="password"
                                required
                                placeholder="••••••••"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        <div className="space-y-1 text-xs font-medium">
                            <label htmlFor="new-password">New Password (min 8 characters)</label>
                            <input
                                id="new-password"
                                type="password"
                                required
                                minLength={8}
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>

                    {passwordMessage.text && (
                        <p className={`text-xs ${passwordMessage.isError ? 'text-red-500' : 'text-green-500'}`}>
                            {passwordMessage.text}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmittingPassword}
                        className="inline-flex h-10 items-center gap-2 rounded-md border border-primary bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Key size={15} />
                        {isSubmittingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>

            {/* Danger Zone / Reset — Admin Only */}
            {authUser?.role === 'admin' && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-lg text-red-500 flex items-center gap-2">
                                <Trash2 size={20} />
                                Danger Zone
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Purge all records from SQLite database to start completely fresh.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleResetAllData}
                            className="inline-flex h-10 items-center gap-2 rounded-md border border-red-700 bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            <Trash2 size={15} />
                            Wipe All Workspace Data
                        </button>
                    </div>
                </div>
            )}

            {/* System Info */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Info size={16} />
                    <span>Agency Pulse Commercial SaaS Suite — v2.4.0</span>
                </div>
                <span>SQLite Database Engine: Online</span>
            </div>
        </div>
    );
}

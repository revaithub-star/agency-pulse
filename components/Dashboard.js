'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    LayoutGrid,
    Users,
    Settings,
    LogOut,
    Sun,
    Moon,
    Menu,
    X,
    Bell,
    CreditCard,
    Filter,
    DollarSign,
    FileText,
    UserPlus,
    ChevronDown,
    Folder,
    Pencil
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { getProjects, saveProject, deleteProject, updateProject } from '@/lib/storage';
import ProjectModal from './ProjectModal';
import StatsCards from './StatsCards';
import GrowthCharts from './GrowthCharts';
import ProjectTable from './ProjectTable';
import ClientList from './ClientList';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import FinancialsView from './FinancialsView';
import ReportsView from './ReportsView';
import UserManagement from './UserManagement';
import SettingsView from './SettingsView';
import { canAccessTab, can } from '@/lib/permissions';

export default function Dashboard({ initialTab = 'dashboard' }) {
    const router = useRouter();
    const pathname = usePathname();

    const [projects, setProjects] = useState([]);
    const [categories, setCategories] = useState([]);
    const [clients, setClients] = useState([]);
    const [authUser, setAuthUser] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [setupOpen, setSetupOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [activeTab, setActiveTab] = useState(initialTab);
    const [isProcessing, setIsProcessing] = useState(false);
    const [theme, setTheme] = useState('light');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [agencyName, setAgencyName] = useState('Agency Pulse');
    const [agencyLogo, setAgencyLogo] = useState(null);
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);

    useEffect(() => {
        if (!pathname) return;
        const segments = pathname.split('/').filter(Boolean);
        const currentTab = segments[0] || initialTab;
        if (['dashboard', 'projects', 'clients', 'financials', 'reports', 'users', 'settings'].includes(currentTab)) {
            setActiveTab(currentTab);
        }
    }, [pathname, initialTab]);

    useEffect(() => {
        const savedTheme = localStorage.getItem('agency_pulse_theme') || 'light';
        setTheme(savedTheme);
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
        }

        const name = localStorage.getItem('agency_pulse_name');
        const logo = localStorage.getItem('agency_pulse_logo');
        if (name) setAgencyName(name);
        if (logo) setAgencyLogo(logo);

        const handleBrandingUpdate = (e) => {
            if (e.detail?.name !== undefined) setAgencyName(e.detail.name || 'Agency Pulse');
            if (e.detail?.logo !== undefined) setAgencyLogo(e.detail.logo);
            if (e.detail?.currency !== undefined) {
                setProjects((prevProjects) => prevProjects.map((project) => ({
                    ...project,
                    currency: e.detail.currency,
                })));
            }
        };

        window.addEventListener('agency_branding_updated', handleBrandingUpdate);
        return () => window.removeEventListener('agency_branding_updated', handleBrandingUpdate);
    }, []);

    const toggleTheme = (newTheme) => {
        const targetTheme = newTheme || (theme === 'dark' ? 'light' : 'dark');
        setTheme(targetTheme);
        localStorage.setItem('agency_pulse_theme', targetTheme);
        if (targetTheme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
        }
    };

    const loadProjects = async () => {
        try {
            const data = await getProjects();
            if (data) setProjects(data);
        } catch (err) {
            console.error('Failed to fetch projects:', err);
        }
    };

    const loadCategories = async () => {
        try {
            const res = await fetch('/api/project-categories');
            if (res.ok) {
                const data = await res.json();
                setCategories(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const loadClients = async () => {
        try {
            const res = await fetch('/api/clients');
            if (res.ok) {
                const data = await res.json();
                setClients(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Failed to fetch clients:', err);
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const setupResponse = await fetch('/api/auth/setup-status', { cache: 'no-store' });
                const setupData = await setupResponse.json().catch(() => ({}));
                if (setupData.setupOpen || setupData.available) {
                    setSetupOpen(true);
                    setAuthChecked(true);
                    return;
                }

                const meResponse = await fetch('/api/auth/me', { cache: 'no-store' });
                if (meResponse.ok) {
                    const user = await meResponse.json();
                    setAuthUser(user?.authenticated ? user : null);
                } else {
                    setAuthUser(null);
                }
            } catch (err) {
                console.error('Auth check error:', err);
            } finally {
                setAuthChecked(true);
            }
        };

        checkAuth();
    }, []);

    useEffect(() => {
        if (!authUser) return;

        loadProjects();
        loadCategories();
        loadClients();
    }, [authUser]);

    // Client-side permission enforcement for tab access
    useEffect(() => {
        if (!authUser) return;
        if (activeTab === 'users' && authUser.role !== 'admin') {
            setActiveTab('dashboard');
            return;
        }
        if (!canAccessTab(authUser, activeTab)) {
            const firstAllowed = ['dashboard', 'projects', 'clients', 'financials', 'reports', 'settings'].find(tab => canAccessTab(authUser, tab));
            setActiveTab(firstAllowed || 'dashboard');
        }
    }, [activeTab, authUser]);

    if (!authChecked) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Loading agency...
                </div>
            </div>
        );
    }

    if (setupOpen) {
        return <SignupForm onSignupComplete={() => {
            setSetupOpen(false);
            window.location.reload();
        }} />;
    }

    if (!authUser) {
        return <LoginForm onLogin={() => {
            setAuthUser({ authenticated: true });
            window.location.reload();
        }} />;
    }

    const handleAddProject = async (data) => {
        setIsProcessing(true);
        try {
            if (editingProject) {
                const updatedProjects = await updateProject(editingProject.id, data);
                if (updatedProjects) setProjects(updatedProjects);
            } else {
                await saveProject(data);
                const freshData = await getProjects();
                if (freshData) setProjects(freshData);
            }
            setIsModalOpen(false);
            setEditingProject(null);
        } catch (err) {
            console.error('Save error:', err);
            alert(`Error saving project: ${err.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this project?')) {
            setIsProcessing(true);
            try {
                const updatedProjects = await deleteProject(id);
                if (updatedProjects) setProjects(updatedProjects);
            } catch (err) {
                console.error('Delete error:', err);
                alert(`Error deleting project: ${err.message}`);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const filteredProjects = (projects || []).filter(p => {
        if (!p) return false;
        if (statusFilter !== 'All' && p.status !== statusFilter) return false;
        const search = searchTerm.toLowerCase();
        const nameMatch = (p.projectName || '').toLowerCase().includes(search);
        const userMatch = (p.userName || '').toLowerCase().includes(search);
        const credentialMatch = (p.credentials || []).some((credential) => (
            `${credential.username || ''} ${credential.email || ''}`.toLowerCase().includes(search)
        ));
        const personMatch = (p.offlinePerson || '').toLowerCase().includes(search);
        const platformMatch = (p.onlinePlatform || '').toLowerCase().includes(search);
        return nameMatch || userMatch || credentialMatch || personMatch || platformMatch;
    }).sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt || 0);
        const dateB = new Date(b.date || b.createdAt || 0);
        return dateB - dateA;
    });

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.reload();
    };

    const navItems = [
        { id: 'dashboard', label: 'Overview', icon: LayoutGrid },
        { id: 'projects', label: 'Projects', icon: DollarSign },
        { id: 'clients', label: 'Clients', icon: Users },
        { id: 'financials', label: 'Financials', icon: CreditCard },
        { id: 'reports', label: 'Reports', icon: FileText },
        { id: 'users', label: 'Users', icon: UserPlus, adminOnly: true },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    const canWriteProjects = can(authUser, 'projects.write');
    const canWriteClients = can(authUser, 'clients.write');

    const handleTabClick = (tabId) => {
        if (tabId === 'users' && authUser?.role !== 'admin') return;
        if (!canAccessTab(authUser, tabId)) return;
        setActiveTab(tabId);
        const targetPath = tabId === 'dashboard' ? '/dashboard' : `/${tabId}`;
        if (pathname !== targetPath) {
            router.push(targetPath);
        }
    };

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="w-64 border-r border-border bg-card flex flex-col hidden md:flex shrink-0 min-h-0">
                <div className="p-6 shrink-0">
                    <div className="flex items-center gap-3 mb-0 px-0.5">
                        <div className="w-16 h-16 rounded-xl bg-secondary/80 border border-border/60 flex items-center justify-center overflow-hidden shrink-0 shadow-sm p-1">
                            {agencyLogo ? (
                                <img
                                    src={agencyLogo}
                                    alt={agencyName}
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <img
                                    src="/AgencyPulseLogo.png"
                                    alt="Agency Pulse Logo"
                                    className="w-full h-full object-contain"
                                />
                            )}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-bold text-base tracking-tight text-foreground truncate leading-tight">
                                {agencyName}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                Workspace
                            </span>
                        </div>
                    </div>
                </div>

                <nav className="space-y-1 px-6 pb-4 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                    {navItems.map((item) => {
                        if (item.adminOnly && authUser?.role !== 'admin') return null;
                        if (!canAccessTab(authUser, item.id) && !item.adminOnly) return null;
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleTabClick(item.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-secondary text-foreground font-semibold shadow-sm'
                                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                                    }`}
                            >
                                <Icon size={18} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Bottom Left Sidebar Section: User Info, Theme Toggle, Settings & Logout */}
                <div className="p-4 border-t border-border space-y-3 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold shrink-0">
                                {(authUser?.email || 'A').substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col truncate">
                                <span className="text-xs font-medium truncate">{authUser?.email || 'Admin User'}</span>
                                <span className="text-[10px] text-muted-foreground uppercase">{authUser?.role || 'admin'}</span>
                            </div>
                        </div>

                        {/* Theme Toggle Button */}
                        <button
                            onClick={() => toggleTheme()}
                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                        >
                            {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-purple-600" />}
                        </button>
                    </div>

                    {/* Setting & Logout Buttons on Bottom Left */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                        <button
                            onClick={() => handleTabClick('settings')}
                            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${activeTab === 'settings'
                                ? 'bg-secondary text-foreground font-semibold'
                                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                                }`}
                            title="System Settings"
                        >
                            <Settings size={14} />
                            <span>Settings</span>
                        </button>

                        <button
                            onClick={handleLogout}
                            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
                            title="Sign Out"
                        >
                            <LogOut size={14} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Navigation Drawer */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden flex">
                        <div className="w-4/5 max-w-xs bg-card border-r border-border h-full flex flex-col shadow-2xl min-h-0">
                            <div className="p-6 space-y-6 shrink-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-9 h-10 rounded-xl bg-secondary/80 border border-border/60 flex items-center justify-center overflow-hidden shrink-0 shadow-sm p-1">
                                            {agencyLogo ? (
                                                <img
                                                    src={agencyLogo}
                                                    alt={agencyName}
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <img
                                                    src="/AgencyPulseLogo.png"
                                                    alt="Agency Pulse Logo"
                                                    className="w-full h-full object-contain"
                                                />
                                            )}
                                        </div>
                                        <span className="font-bold text-base tracking-tight text-foreground truncate max-w-[140px]">
                                            {agencyName}
                                        </span>
                                    </div>
                                    <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <nav className="space-y-1 px-6 pb-4 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                                {navItems.map((item) => {
                                    if (item.adminOnly && authUser?.role !== 'admin') return null;
                                    if (!canAccessTab(authUser, item.id) && !item.adminOnly) return null;
                                    const Icon = item.icon;
                                    const isActive = activeTab === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => { handleTabClick(item.id); setMobileMenuOpen(false); }}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                                ? 'bg-secondary text-foreground font-semibold'
                                                : 'text-muted-foreground hover:bg-secondary/50'
                                                }`}
                                        >
                                            <Icon size={18} />
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </nav>

                            <div className="pt-4 px-6 pb-6 border-t border-border space-y-3 shrink-0">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground truncate max-w-[180px]">{authUser?.email}</span>
                                    <button
                                        onClick={() => toggleTheme()}
                                        className="p-1 rounded-md text-muted-foreground hover:text-foreground shrink-0"
                                    >
                                        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => { handleTabClick('settings'); setMobileMenuOpen(false); }}
                                        className="flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium border border-border"
                                    >
                                        <Settings size={14} /> Settings
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium bg-red-500/10 text-red-500"
                                    >
                                        <LogOut size={14} /> Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
                    </div>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors shrink-0"
                        >
                            <Menu size={20} />
                        </button>
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-secondary/80 border border-border/60 flex items-center justify-center overflow-hidden shrink-0">
                                {agencyLogo ? (
                                    <img src={agencyLogo} alt={agencyName} className="w-full h-full object-contain p-0.5" />
                                ) : (
                                    <img src="/AgencyPulseLogo.png" alt="Agency Pulse" className="w-full h-full object-contain p-0.5" />
                                )}
                            </div>
                            <span className="font-bold text-sm tracking-tight truncate">{agencyName}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {canWriteProjects && activeTab === 'projects' && (
                            <button
                                onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
                                className="h-8 px-3 rounded-md bg-white text-black hover:bg-white/90 text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0"
                            >
                                <Plus size={14} />
                                <span className="hidden xs:inline">New</span>
                            </button>
                        )}
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors shrink-0"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </header>

                {/* Body Content */}
                <div className="p-4 md:p-8 max-w-7xl w-full mx-auto space-y-8 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                    {activeTab === 'dashboard' && canAccessTab(authUser, 'dashboard') && (
                        <>
                            <div className="flex flex-col sm:flex-col sm:items-left justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Executive Dashboard</h1>
                                    <p className="text-muted-foreground mt-1 text-sm">
                                        Real-time operational metrics, project tracking, and financial intelligence.
                                    </p>
                                </div>

                                {canWriteProjects && (
                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto sm:justify-end">
                                        <button
                                            onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
                                            className="app-button app-button-primary"
                                        >
                                            <Plus size={16} />
                                            <span className="hidden sm:inline">New Project</span>
                                            <span className="sm:hidden">New Project</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <StatsCards projects={projects} />

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 rounded-xl border border-border bg-card p-4 md:p-6">
                                    <h3 className="font-semibold text-lg mb-4">Revenue Growth</h3>
                                    <div className="overflow-x-auto custom-scrollbar -mx-2 px-2">
                                        <GrowthCharts projects={projects} type="line" />
                                    </div>
                                </div>
                                <div className="rounded-xl border border-border bg-card p-4 md:p-6">
                                    <h3 className="font-semibold text-lg mb-4">Services Distribution</h3>
                                    <div className="overflow-x-auto custom-scrollbar -mx-2 px-2">
                                        <GrowthCharts projects={projects} type="doughnut" />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-border bg-card overflow-hidden">
                                <div className="p-4 md:p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h3 className="font-semibold text-lg">Recent Projects</h3>
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                            Showing active agency client projects
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleTabClick('projects')}
                                        className="text-xs text-primary hover:underline font-medium self-start sm:self-auto"
                                    >
                                        View All
                                    </button>
                                </div>
                                <ProjectTable
                                    projects={filteredProjects.slice(0, 5)}
                                    onDelete={canWriteProjects ? handleDelete : undefined}
                                    onEdit={canWriteProjects ? (p) => { setEditingProject(p); setIsModalOpen(true); } : undefined}
                                />
                            </div>
                        </>
                    )}

                    {activeTab === 'projects' && canAccessTab(authUser, 'projects') && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-col sm:items-left justify-between gap-4">

                                <div className="min-w-0">
                                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">All Projects</h2>
                                    <p className="text-muted-foreground mt-1 text-sm">
                                        Manage client projects, server credentials, and build deliverables.
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto sm:justify-end">
                                    <div className="relative flex-1 sm:flex-initial sm:w-64">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="text"
                                            placeholder="Search projects..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-transparent text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        />
                                    </div>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <option value="All">All Statuses</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                        <option value="On Hold">On Hold</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                    {canWriteProjects && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setCategoryModalOpen(true)}
                                                className="h-10 px-3 rounded-md border border-input bg-background hover:bg-secondary text-sm font-medium transition-colors flex items-center gap-2 shrink-0"
                                                title="Manage Categories"
                                            >
                                                <Folder size={16} />
                                                <span className="hidden lg:inline">Categories</span>
                                                <ChevronDown size={14} className="lg:hidden" />
                                            </button>
                                            <button
                                                onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
                                                className="app-button app-button-primary"
                                            >
                                                <Plus size={16} />
                                                <span className="hidden sm:inline">New Project</span>
                                                <span className="sm:hidden">New</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="rounded-xl border border-border bg-card overflow-hidden">
                                <ProjectTable
                                    projects={filteredProjects}
                                    onDelete={canWriteProjects ? handleDelete : undefined}
                                    onEdit={canWriteProjects ? (p) => { setEditingProject(p); setIsModalOpen(true); } : undefined}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'clients' && canAccessTab(authUser, 'clients') && (
                        <ClientList
                            projects={projects}
                            clients={clients}
                            authUser={authUser}
                            onRefresh={loadClients}
                        />
                    )}

                    {activeTab === 'financials' && canAccessTab(authUser, 'financials') && (
                        <FinancialsView projects={projects} onRefresh={loadProjects} authUser={authUser} />
                    )}

                    {activeTab === 'reports' && canAccessTab(authUser, 'reports') && (
                        <ReportsView projects={projects} />
                    )}

                    {activeTab === 'users' && authUser?.role === 'admin' && (
                        <UserManagement authUser={authUser} />
                    )}

                    {activeTab === 'settings' && canAccessTab(authUser, 'settings') && (
                        <SettingsView
                            theme={theme}
                            onToggleTheme={toggleTheme}
                            authUser={authUser}
                            onUpdateBranding={({ name, logo }) => {
                                if (name !== undefined) setAgencyName(name || 'Agency Pulse');
                                if (logo !== undefined) setAgencyLogo(logo);
                            }}
                        />
                    )}
                </div>
            </main>

            <ProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddProject}
                editingProject={editingProject}
                categories={categories}
                clients={clients}
            />

            {/* Project Categories Management Modal */}
            {categoryModalOpen && (
                <CategoryManager
                    isOpen={categoryModalOpen}
                    onClose={() => { setCategoryModalOpen(false); loadCategories(); }}
                    categories={categories}
                    canWrite={canWriteProjects}
                />
            )}
        </div>
    );
}

function CategoryManager({ isOpen, onClose, categories, canWrite }) {
    const [items, setItems] = useState([]);
    const [newName, setNewName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setItems(categories || []);
            setNewName('');
            setEditingId(null);
            setError('');
        }
    }, [isOpen, categories]);

    if (!isOpen) return null;

    const handleAdd = async () => {
        if (!newName.trim() || !canWrite) return;
        setBusy(true);
        setError('');
        try {
            const res = await fetch('/api/project-categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to add');
            setItems(prev => [...prev, data]);
            setNewName('');
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    const handleSaveEdit = async (id) => {
        if (!editName.trim() || !canWrite) return;
        setBusy(true);
        setError('');
        try {
            const res = await fetch(`/api/project-categories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update');
            setItems(prev => prev.map(c => c.id === id ? data : c));
            setEditingId(null);
            setEditName('');
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async (id) => {
        if (!canWrite) return;
        if (!confirm('Delete this category?')) return;
        setBusy(true);
        setError('');
        try {
            const res = await fetch(`/api/project-categories/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete');
            setItems(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-0 shadow-xl flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
                    <div>
                        <h3 className="text-lg font-bold">Project Categories</h3>
                        <p className="text-xs text-muted-foreground mt-1">Manage your project category list</p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                    {error && (
                        <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-xs text-red-500">
                            {error}
                        </div>
                    )}

                    {canWrite && (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="New category name..."
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                                className="flex-1 h-10 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                            <button
                                onClick={handleAdd}
                                disabled={busy || !newName.trim()}
                                className="h-10 px-4 rounded-md bg-white text-black hover:bg-white/90 disabled:opacity-50 text-sm font-medium transition-colors"
                            >
                                Add
                            </button>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        {items.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">No categories yet.</p>
                        ) : (
                            items.map(cat => (
                                <div key={cat.id} className="flex items-center gap-2 p-2 rounded-md border border-border hover:bg-secondary/30">
                                    {editingId === cat.id ? (
                                        <>
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleSaveEdit(cat.id)}
                                                autoFocus
                                                className="flex-1 h-8 rounded-md border border-input bg-transparent px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            />
                                            <button
                                                onClick={() => handleSaveEdit(cat.id)}
                                                disabled={busy || !editName.trim()}
                                                className="h-8 px-2 rounded-md bg-white text-black hover:bg-white/90 disabled:opacity-50 text-xs font-medium"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => { setEditingId(null); setEditName(''); }}
                                                disabled={busy}
                                                className="h-8 px-2 rounded-md border border-input text-xs font-medium hover:bg-secondary"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <Folder size={14} className="text-muted-foreground shrink-0 ml-1" />
                                            <span className="flex-1 text-sm truncate">{cat.name}</span>
                                            {canWrite && (
                                                <>
                                                    <button
                                                        onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                                                        className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                                                        title="Update category"
                                                    >
                                                        <Pencil size={13} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(cat.id)}
                                                        className="p-1.5 rounded-md text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                                                        title="Delete"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-border flex justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md bg-white text-black hover:bg-white/90 text-sm font-medium transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}

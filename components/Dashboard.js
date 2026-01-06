'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Plus, 
    Search,
    Download,
    LayoutGrid,
    Users,
    Settings,
    Bell,
    CreditCard,
    MoreHorizontal,
    Filter
} from 'lucide-react';
import { getProjects, saveProject, deleteProject, updateProject } from '@/lib/storage';
import ProjectModal from './ProjectModal';
import StatsCards from './StatsCards';
import GrowthCharts from './GrowthCharts';
import ProjectTable from './ProjectTable';
import * as Tooltip from '@radix-ui/react-tooltip';
// Avatar import removed to fix build error


import ClientList from './ClientList';

export default function Dashboard() {
    const [projects, setProjects] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('dashboard'); // Default to dashboard

    useEffect(() => {
        // Initial fetch
        const fetchProjects = async () => {
            const data = await getProjects();
            // Only update if we successfully fetched data (not null).
            // This prevents wiping the dashboard on transient API/File errors.
            if (data !== null) {
                setProjects(data);
            }
        };
        fetchProjects();

        // Poll for updates every 2 seconds (to handle manual file edits or multi-tab changes)
        const intervalId = setInterval(fetchProjects, 2000);

        return () => clearInterval(intervalId);
    }, []);

    const handleAddProject = async (data) => {
        if (editingProject) {
            const updatedProjects = await updateProject(editingProject.id, data);
            if (updatedProjects) setProjects(updatedProjects);
        } else {
            // Re-fetch or manually append if the API returns just the new project.
            // Our previous create logic returned the new object, but our storage wrappers 
            // were slightly inconsistent. Let's fix.
            // Actually our POST /api/projects returns the new project ONLY,
            // so we should append it to state to avoid a full re-fetch or inconsistent state.
            // WAIT - the file logic for GET returns ALL projects.
            // The file logic for PUT/DELETE returns ALL projects.
            // The POST logic returns the NEW project.
            // Let's stick to simple state updates.
            
            const newProject = await saveProject(data);
            if (newProject) {
                // Update state directly with the new project to avoid read-after-write race conditions
                setProjects(prev => [...prev, newProject]);
            }
        }
        setIsModalOpen(false);
        setEditingProject(null);
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this project?')) {
            const updatedProjects = await deleteProject(id);
            if (updatedProjects) setProjects(updatedProjects);
        }
    };

    const handleExport = () => {
        // ... (same logic)
    };
    const filteredProjects = projects.filter(p => {
        const search = searchTerm.toLowerCase();
        const nameMatch = (p.projectName || '').toLowerCase().includes(search);
        const userMatch = (p.userName || '').toLowerCase().includes(search);
        const personMatch = (p.offlinePerson || '').toLowerCase().includes(search);
        const platformMatch = (p.onlinePlatform || '').toLowerCase().includes(search);
        return nameMatch || userMatch || personMatch || platformMatch;
    }).sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

    return (
        <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-white/20">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border p-6 flex flex-col hidden md:flex">
                <div className="flex items-center gap-2 mb-10">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                        <div className="w-4 h-4 bg-black rounded-sm" />
                    </div>
                    <span className="font-semibold tracking-tight">Acme Agency</span>
                </div>

                <nav className="space-y-1 flex-1">
                    {[
                        { id: 'dashboard', icon: LayoutGrid, label: 'Overview' },
                        { id: 'projects', icon: CreditCard, label: 'Projects' },
                        { id: 'clients', icon: Users, label: 'Clients' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                                activeTab === item.id 
                                ? 'bg-secondary text-primary' 
                                : 'text-muted-foreground hover:bg-secondary/50 hover:text-primary'
                            }`}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="pt-6 border-t border-border">
                   <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
                            JD
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate">John Doe</p>
                            <p className="text-xs text-muted-foreground truncate">Admin</p>
                        </div>
                        <Settings size={16} className="text-muted-foreground cursor-pointer hover:text-primary" />
                   </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="hover:text-primary cursor-pointer">Dashboard</span>
                        <span>/</span>
                        <span className="text-primary font-medium capitalize">{activeTab}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <input 
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-9 w-64 rounded-md border border-input bg-transparent pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-ring transition-all"
                            />
                        </div>
                        <button className="relative p-2 text-muted-foreground hover:text-primary transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-8 space-y-8">
                    {activeTab === 'dashboard' && (
                        <>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
                                    <p className="text-muted-foreground mt-1">
                                        Track your agency's performance and active projects.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="h-9 px-4 rounded-md border border-input bg-transparent hover:bg-secondary text-sm font-medium transition-colors cursor-pointer">
                                        <Filter size={16} className="inline mr-2" />
                                        Filter
                                    </button>
                                    <button 
                                        onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
                                        className="h-9 px-4 rounded-md bg-white text-black hover:bg-white/90 text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
                                    >
                                        <Plus size={16} />
                                        New Project
                                    </button>
                                </div>
                            </div>

                            <StatsCards projects={projects} />
                            
                            <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
                                <div className="lg:col-span-4 rounded-xl border border-border bg-card p-6">
                                    <h3 className="text-base font-semibold mb-4">Revenue Growth</h3>
                                    <GrowthCharts projects={projects} type="line" />
                                </div>
                                 <div className="lg:col-span-3 rounded-xl border border-border bg-card p-6">
                                    <h3 className="text-base font-semibold mb-4">Project Distribution</h3>
                                    <GrowthCharts projects={projects} type="doughnut" />
                                </div>
                            </div>

                            <div className="rounded-xl border border-border bg-card overflow-hidden">
                                <div className="p-6 border-b border-border flex items-center justify-between">
                                    <h3 className="text-base font-semibold">Recent Projects</h3>
                                    <button 
                                        onClick={() => setActiveTab('projects')}
                                        className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                                    >
                                        View All
                                    </button>
                                </div>
                                <ProjectTable 
                                    projects={filteredProjects.slice(0, 5)} 
                                    onDelete={handleDelete}
                                    onEdit={(p) => { setEditingProject(p); setIsModalOpen(true); }}
                                />
                            </div>
                        </>
                    )}

                    {activeTab === 'projects' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-3xl font-bold tracking-tight">All Projects</h2>
                                    <p className="text-muted-foreground mt-1">
                                        Manage your entire project library and history.
                                    </p>
                                </div>
                                <button 
                                    onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
                                    className="h-9 px-4 rounded-md bg-white text-black hover:bg-white/90 text-sm font-medium transition-colors flex items-center gap-2"
                                >
                                    <Plus size={16} />
                                    New Project
                                </button>
                            </div>
                            <div className="rounded-xl border border-border bg-card overflow-hidden">
                                <ProjectTable 
                                    projects={filteredProjects}
                                    onDelete={handleDelete}
                                    onEdit={(p) => { setEditingProject(p); setIsModalOpen(true); }}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'clients' && (
                       <ClientList projects={projects} />
                    )}
                </div>
            </main>

            <ProjectModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddProject}
                editingProject={editingProject}
            />
        </div>
    );
}

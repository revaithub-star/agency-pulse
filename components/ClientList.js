'use client';

import { User, Mail, Calendar, CreditCard } from 'lucide-react';

export default function ClientList({ projects }) {
    // specific aggregator for clients
    const clients = projects.reduce((acc, p) => {
        // ID for grouping: prefer userName, fallback to offlinePerson, fallback to 'Unknown'
        const clientId = p.sourceType === 'online' ? (p.userName || 'Unknown') : (p.offlinePerson || p.userName || 'Unknown');
        const projectSource = p.sourceType === 'online' ? p.onlinePlatform : 'Offline';
        
        if (!acc[clientId]) {
            acc[clientId] = {
                id: clientId,
                name: clientId,
                email: p.email || 'N/A',
                totalRevenue: 0,
                projectCount: 0,
                lastActive: p.date,
                sources: new Set(),
                status: 'Active' // simplistic status
            };
        }
        
        acc[clientId].totalRevenue += parseFloat(p.amount) || 0;
        acc[clientId].projectCount += 1;
        acc[clientId].sources.add(projectSource);
        
        if (new Date(p.date) > new Date(acc[clientId].lastActive)) {
            acc[clientId].lastActive = p.date;
        }
        
        return acc;
    }, {});

    const clientList = Object.values(clients).sort((a, b) => b.totalRevenue - a.totalRevenue);

    if (clientList.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
                <User size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Clients Found</h3>
                <p className="text-muted-foreground mt-2">
                    Add projects to populate your client directory.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
                    <p className="text-muted-foreground mt-1">
                        Active directory ({clientList.length} total)
                    </p>
                </div>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <table className="w-full caption-bottom text-sm text-left">
                    <thead className="[&_tr]:border-b [&_tr]:border-border bg-muted/20">
                        <tr className="border-b border-border transition-colors">
                            <th className="h-10 px-4 align-middle font-medium text-muted-foreground">Client / Contact</th>
                            <th className="h-10 px-4 align-middle font-medium text-muted-foreground">Email</th>
                            <th className="h-10 px-4 align-middle font-medium text-muted-foreground">Projects</th>
                            <th className="h-10 px-4 align-middle font-medium text-muted-foreground">Total Spend</th>
                            <th className="h-10 px-4 align-middle font-medium text-muted-foreground">Last Active</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {clientList.map((client) => (
                            <tr key={client.id} className="border-b border-border transition-colors hover:bg-muted/30">
                                <td className="p-4 align-middle font-medium">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs">
                                            {client.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col">
                                            <span>{client.name}</span>
                                            <span className="text-xs text-muted-foreground">{Array.from(client.sources).join(', ')}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 align-middle text-muted-foreground">{client.email}</td>
                                <td className="p-4 align-middle">{client.projectCount}</td>
                                <td className="p-4 align-middle font-mono">
                                    {client.totalRevenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                                </td>
                                <td className="p-4 align-middle text-muted-foreground text-xs">
                                    {new Date(client.lastActive).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

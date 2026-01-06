'use client';

import { Trash2, Edit2, User, Globe, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function ProjectTable({ projects, onDelete, onEdit }) {
    if (projects.length === 0) {
        return <div className="p-12 text-center text-muted-foreground text-sm">No active projects. Click "New Project" to add your first entry.</div>;
    }

    return (
        <div className="w-full overflow-auto">
            <table className="w-full caption-bottom text-sm text-left">
                <thead className="[&_tr]:border-b [&_tr]:border-border bg-muted/20">
                    <tr className="border-b border-border transition-colors">
                        <th className="h-10 px-4 align-middle font-medium text-muted-foreground w-[250px]">Project</th>
                        <th className="h-10 px-4 align-middle font-medium text-muted-foreground">Source</th>
                        <th className="h-10 px-4 align-middle font-medium text-muted-foreground">Status</th>
                        <th className="h-10 px-4 align-middle font-medium text-muted-foreground">Amount</th>
                        <th className="h-10 px-4 align-middle font-medium text-muted-foreground">Date</th>
                        <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                    {projects.map((p) => (
                        <tr key={p.id} className="border-b border-border transition-colors hover:bg-muted/30 group">
                            <td className="p-4 align-middle">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-foreground">{p.projectName}</span>
                                    <span className="text-xs text-muted-foreground mt-0.5">{p.userName}</span>
                                </div>
                            </td>
                            <td className="p-4 align-middle">
                                <div className="flex items-center gap-2">
                                    {p.sourceType === 'online' ? (
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/10 text-blue-600 text-xs font-medium border border-blue-200/20">
                                            <Globe size={12} />
                                            {p.onlinePlatform}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-orange-500/10 text-orange-600 text-xs font-medium border border-orange-200/20">
                                            <User size={12} />
                                            Ref: {p.offlinePerson}
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td className="p-4 align-middle">
                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors ${
                                    p.status === 'Completed' ? 'border-transparent bg-green-500/15 text-green-700' :
                                    p.status === 'In Progress' ? 'border-transparent bg-blue-500/15 text-blue-700' :
                                    p.status === 'Cancelled' ? 'border-transparent bg-red-500/15 text-red-700' :
                                    'border-transparent bg-secondary text-secondary-foreground'
                                }`}>
                                    {p.status}
                                </span>
                            </td>
                            <td className="p-4 align-middle font-mono font-medium tracking-tight">
                                {parseFloat(p.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                            </td>
                            <td className="p-4 align-middle text-muted-foreground text-xs">
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={12} className="opacity-70" />
                                    {format(new Date(p.date), 'MMM dd, yyyy')}
                                </div>
                            </td>
                            <td className="p-4 align-middle text-right">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2">
                                    <button 
                                        onClick={() => onEdit(p)}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-foreground text-muted-foreground transition-colors"
                                        title="Edit Project"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button 
                                        onClick={() => onDelete(p.id)}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background hover:bg-red-500/10 hover:text-red-600 text-muted-foreground transition-colors"
                                        title="Delete Project"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}


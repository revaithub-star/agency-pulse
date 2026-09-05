export const PERMISSIONS = [
    { id: 'projects.read', label: 'View Projects' },
    { id: 'projects.write', label: 'Create/Edit Projects' },
    { id: 'clients.read', label: 'View Clients' },
    { id: 'clients.write', label: 'Create/Edit Clients' },
    { id: 'financials.read', label: 'View Financials' },
    { id: 'financials.write', label: 'Manage Payments/Expenses' },
    { id: 'reports.read', label: 'View & Export Reports' },
    { id: 'users.manage', label: 'Manage Users' },
];

export const TAB_PERMISSIONS = {
    dashboard: 'reports.read',
    projects: 'projects.read',
    clients: 'clients.read',
    financials: 'financials.read',
    reports: 'reports.read',
    users: 'users.manage',
    settings: null,
};

export function can(user, permission) {
    if (!user) return false;
    if (user.role === 'admin') return true;
    const permissions = Array.isArray(user.permissions) ? user.permissions : [];
    return permissions.includes('*') || permissions.includes(permission);
}

export function canAccessTab(user, tabId) {
    const permission = TAB_PERMISSIONS[tabId];
    if (!permission) return Boolean(user);
    return can(user, permission);
}

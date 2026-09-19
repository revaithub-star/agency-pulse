export function emptyServerDetails() {
    return { serverName: '', ip: '', username: '', password: '', notes: '' };
}

export function emptyHostingAccount() {
    return { provider: '', plan: '', domain: '', username: '', password: '', notes: '' };
}

export function emptyDomainDetails() {
    return { registrar: '', domainName: '', expiryDate: '', username: '', password: '', nameservers: '', notes: '' };
}

export function migrateHostingDetails(hostingDetails) {
    if (!hostingDetails || typeof hostingDetails !== 'object' || Array.isArray(hostingDetails)) {
        return { server: emptyServerDetails(), hosting: emptyHostingAccount(), domain: emptyDomainDetails() };
    }
    if (hostingDetails.server || hostingDetails.hosting || hostingDetails.domain) {
        return {
            server: { ...emptyServerDetails(), ...(hostingDetails.server || {}) },
            hosting: { ...emptyHostingAccount(), ...(hostingDetails.hosting || {}) },
            domain: { ...emptyDomainDetails(), ...(hostingDetails.domain || {}) },
        };
    }
    return {
        server: {
            serverName: hostingDetails.serverName || '',
            ip: hostingDetails.ip || '',
            username: hostingDetails.username || '',
            password: hostingDetails.password || '',
            notes: hostingDetails.notes || '',
        },
        hosting: emptyHostingAccount(),
        domain: emptyDomainDetails(),
    };
}

export function normalizeProjectInput(project, { partial = false } = {}) {
    const errors = [];
    if (!project || typeof project !== 'object') {
        return { value: null, errors: ['Invalid project payload'] };
    }

    if (!partial || project.projectName !== undefined) {
        if (!project.projectName || !String(project.projectName).trim()) {
            errors.push('Project name is required');
        }
    }

    const value = {
        ...project,
        projectName: project.projectName !== undefined ? String(project.projectName).trim() : undefined,
        projectUrl: project.projectUrl !== undefined ? String(project.projectUrl || '').trim() : undefined,
        sourceType: project.sourceType !== undefined ? String(project.sourceType || 'online') : undefined,
        onlinePlatform: project.onlinePlatform !== undefined ? String(project.onlinePlatform || '').trim() : undefined,
        offlinePerson: project.offlinePerson !== undefined ? String(project.offlinePerson || '').trim() : undefined,
        clientId: project.clientId !== undefined ? (project.clientId || null) : undefined,
        date: project.date !== undefined ? String(project.date || '').trim() : undefined,
        startDate: project.startDate !== undefined ? String(project.startDate || '').trim() : undefined,
        endDate: project.endDate !== undefined ? String(project.endDate || '').trim() : undefined,
        amount: project.amount !== undefined ? String(project.amount || '0') : undefined,
        budget: project.budget !== undefined ? String(project.budget || '0') : undefined,
        currency: project.currency !== undefined ? String(project.currency || 'INR') : undefined,
        category: project.category !== undefined ? String(project.category || '').trim() : undefined,
        status: project.status !== undefined ? String(project.status || 'In Progress') : undefined,
        statusReason: project.statusReason !== undefined ? String(project.statusReason || '').trim() : undefined,
        notes: project.notes !== undefined ? String(project.notes || '').trim() : undefined,
        credentials: Array.isArray(project.credentials) ? project.credentials : undefined,
        hostingDetails: project.hostingDetails ? migrateHostingDetails(project.hostingDetails) : undefined,
    };

    Object.keys(value).forEach(key => {
        if (value[key] === undefined) delete value[key];
    });

    return { value, errors };
}

const redactedValue = '[REDACTED]';

export function publicProject(project, { includeSecrets = false } = {}) {
    if (!project) return null;
    const p = { ...project };
    if (!includeSecrets) {
        if (Array.isArray(p.credentials)) {
            p.credentials = p.credentials.map(c => ({ ...c, password: c.password ? redactedValue : '' }));
        }
        if (p.hostingDetails) {
            const h = migrateHostingDetails(p.hostingDetails);
            p.hostingDetails = {
                server: { ...h.server, password: h.server.password ? redactedValue : '' },
                hosting: { ...h.hosting, password: h.hosting.password ? redactedValue : '' },
                domain: { ...h.domain, password: h.domain.password ? redactedValue : '' },
            };
        }
    }
    return p;
}

export function publicProjects(projects, options) {
    if (!Array.isArray(projects)) return [];
    return projects.map(p => publicProject(p, options));
}
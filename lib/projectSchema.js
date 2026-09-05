const projectStatuses = ['In Progress', 'Completed', 'On Hold', 'Cancelled'];
const projectSources = ['online', 'offline'];
const knownPlatforms = ['Freelance', 'Fiverr', 'Upwork', 'LinkedIn', 'Other'];

const textFields = [
    'projectName',
    'projectUrl',
    'onlinePlatform',
    'offlinePerson',
    'date',
    'startDate',
    'endDate',
    'category',
    'currency',
    'clientId',
    'notes',
    'status',
    'statusReason',
    'sourceType'
];

const credentialFields = ['serviceName', 'username', 'email', 'password', 'url'];
const serverFields = ['serverName', 'ip', 'username', 'password', 'notes'];
const hostingAccountFields = ['provider', 'plan', 'domain', 'username', 'password', 'notes'];
const writableFields = [
    ...textFields,
    'amount',
    'budget',
    'credentials',
    'hostingDetails',
    'includeCredentials',
    'includeHosting',
    'userName',
    'email',
    'password',
    'id',
    'createdAt'
];

const isPlainObject = (value) => (
    value !== null && typeof value === 'object' && !Array.isArray(value)
);

const cleanText = (value) => typeof value === 'string' ? value.trim() : '';

const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const normalizeCredential = (credential) => {
    if (!isPlainObject(credential)) return null;

    return credentialFields.reduce((result, field) => {
        result[field] = cleanText(credential[field]);
        return result;
    }, {});
};

const pickFields = (source, fields) => (
    fields.reduce((result, field) => {
        result[field] = cleanText(source?.[field]);
        return result;
    }, {})
);

export function migrateHostingDetails(hostingDetails) {
    if (!isPlainObject(hostingDetails)) {
        return { server: pickFields({}, serverFields), hosting: pickFields({}, hostingAccountFields) };
    }
    if (hostingDetails.server || hostingDetails.hosting) {
        return {
            server: pickFields(hostingDetails.server || {}, serverFields),
            hosting: pickFields(hostingDetails.hosting || {}, hostingAccountFields),
        };
    }
    return {
        server: pickFields(hostingDetails, serverFields),
        hosting: pickFields({}, hostingAccountFields),
    };
}

const normalizeHostingDetails = (hostingDetails) => {
    if (!isPlainObject(hostingDetails)) return undefined;
    return migrateHostingDetails(hostingDetails);
};

const hostingSectionHasValue = (section) => (
    section && Object.values(section).some((value) => Boolean(value))
);

export function hostingDetailsHaveContent(hostingDetails) {
    const migrated = migrateHostingDetails(hostingDetails);
    return hostingSectionHasValue(migrated.server) || hostingSectionHasValue(migrated.hosting);
}

export function normalizeProjectInput(input, { partial = false } = {}) {
    if (!isPlainObject(input)) {
        return { value: null, errors: ['Request body must be a JSON object'] };
    }

    const errors = [];
    const unknownFields = Object.keys(input).filter((field) => !writableFields.includes(field));
    if (unknownFields.length > 0) {
        errors.push(`Unknown field: ${unknownFields[0]}`);
    }

    const value = {};
    textFields.forEach((field) => {
        if (field in input) value[field] = cleanText(input[field]);
    });

    if ('amount' in input) {
        const amount = typeof input.amount === 'number' ? input.amount : Number(cleanText(input.amount));
        if (!Number.isFinite(amount) || amount < 0) {
            errors.push('Amount must be a non-negative number');
        } else {
            value.amount = String(amount);
        }
    }

    if ('budget' in input) {
        const budget = typeof input.budget === 'number' ? input.budget : Number(cleanText(input.budget));
        if (!Number.isFinite(budget) || budget < 0) errors.push('Budget must be a non-negative number');
        else value.budget = String(budget);
    }

    if ('credentials' in input) {
        if (!Array.isArray(input.credentials)) {
            errors.push('Credentials must be an array');
        } else {
            value.credentials = input.credentials.map(normalizeCredential);
            if (value.credentials.some((credential) => credential === null)) {
                errors.push('Each credential must be an object');
            }
        }
    } else if (input.userName || input.email || input.password) {
        value.credentials = [{
            serviceName: '',
            username: cleanText(input.userName),
            email: cleanText(input.email),
            password: cleanText(input.password),
            url: '',
        }];
    }

    if ('hostingDetails' in input) {
        if (!isPlainObject(input.hostingDetails)) {
            errors.push('Hosting details must be an object');
        } else {
            value.hostingDetails = normalizeHostingDetails(input.hostingDetails);
        }
    }

    if (!partial) {
        if (!value.projectName) errors.push('Project name is required');
        if (!value.date || !isIsoDate(value.date)) {
            errors.push('Date must use YYYY-MM-DD format');
        }
        if (!value.amount) errors.push('Amount is required');
        if (!value.status) value.status = 'In Progress';
        if (!value.sourceType) value.sourceType = 'online';
    }

    const status = value.status;
    if (status && !projectStatuses.includes(status)) {
        errors.push('Status is invalid');
    }

    if (status === 'In Progress' || status === 'Completed' || status === 'On Hold' || status === 'Cancelled') {
        if ('startDate' in value || !partial) {
            if (!value.startDate || !isIsoDate(value.startDate)) {
                errors.push('Start date is required and must use YYYY-MM-DD format');
            }
        }
    }

    if (status === 'In Progress' && ('endDate' in value || !partial)) {
        if (!value.endDate || !isIsoDate(value.endDate)) {
            errors.push('Expected completion date is required and must use YYYY-MM-DD format');
        }
    }

    if (status === 'Completed' && ('endDate' in value || !partial)) {
        if (!value.endDate || !isIsoDate(value.endDate)) {
            errors.push('End date is required and must use YYYY-MM-DD format');
        }
    }

    if ((status === 'On Hold' || status === 'Cancelled') && ('statusReason' in value || !partial)) {
        if (!value.statusReason) {
            errors.push(status === 'On Hold' ? 'A reason is required when a project is on hold' : 'A reason is required when a project is cancelled');
        }
    }

    if (value.startDate && value.endDate && isIsoDate(value.startDate) && isIsoDate(value.endDate) && value.startDate > value.endDate) {
        errors.push('End date cannot be earlier than start date');
    }

    if (value.sourceType && !projectSources.includes(value.sourceType)) {
        errors.push('Source type is invalid');
    }
    if (value.sourceType === 'offline' && ('offlinePerson' in value || !partial) && !value.offlinePerson) {
        errors.push('Referral person / name is required for offline projects');
    }
    if (value.projectUrl && !/^https?:\/\//i.test(value.projectUrl)) {
        errors.push('Project URL must start with http:// or https://');
    }
    if (value.credentials) {
        value.credentials.forEach((credential, index) => {
            if (credential.url && !/^https?:\/\//i.test(credential.url)) {
                errors.push(`Credential ${index + 1} URL must start with http:// or https://`);
            }
        });
    }

    return { value: errors.length ? null : value, errors };
}

function redactHosting(hostingDetails) {
    const migrated = migrateHostingDetails(hostingDetails);
    if (migrated.server?.password) migrated.server.password = '[REDACTED]';
    if (migrated.hosting?.password) migrated.hosting.password = '[REDACTED]';
    return migrated;
}

export function publicProject(project, { includeSecrets = false } = {}) {
    const next = { ...project };

    if (next.password) next.password = '[REDACTED]';

    if (!includeSecrets) {
        next.credentials = [];
        next.hostingDetails = { server: pickFields({}, serverFields), hosting: pickFields({}, hostingAccountFields) };
        return next;
    }

    if (Array.isArray(next.credentials)) {
        next.credentials = next.credentials.map((credential) => ({
            ...credential,
            password: credential.password ? '[REDACTED]' : ''
        }));
    }

    if (next.hostingDetails) {
        next.hostingDetails = redactHosting(next.hostingDetails);
    }

    return next;
}

export function publicProjects(projects, options) {
    return projects.map((project) => publicProject(project, options));
}

export { projectStatuses, projectSources, knownPlatforms };

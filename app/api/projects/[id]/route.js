import { NextResponse } from 'next/server';
import { readDb, withDbMutation, writeDb } from '@/lib/db';
import { migrateHostingDetails, normalizeProjectInput, publicProjects } from '@/lib/projectSchema';
import { requirePermission } from '@/lib/access';
import { can } from '@/lib/permissions';

const redactedValue = '[REDACTED]';

function preserveRedactedSecrets(existingProject, updates) {
    const merged = { ...updates };
    const existingCredentials = Array.isArray(existingProject.credentials) ? existingProject.credentials : [];

    if (Array.isArray(merged.credentials)) {
        merged.credentials = merged.credentials.map((credential, index) => {
            const existingCredential = existingCredentials[index];
            if (!existingCredential || credential.password !== redactedValue) return credential;
            return { ...credential, password: existingCredential.password || '' };
        });
    }

    if (merged.hostingDetails) {
        const existingHosting = migrateHostingDetails(existingProject.hostingDetails);
        const nextHosting = migrateHostingDetails(merged.hostingDetails);
        if (nextHosting.server?.password === redactedValue) {
            nextHosting.server.password = existingHosting.server?.password || '';
        }
        if (nextHosting.hosting?.password === redactedValue) {
            nextHosting.hosting.password = existingHosting.hosting?.password || '';
        }
        merged.hostingDetails = nextHosting;
    }

    return merged;
}

export async function PUT(request, { params }) {
    try {
        const auth = await requirePermission('projects.write');
        if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
        const { id } = await params;
        const updates = await request.json();
        const { value, errors } = normalizeProjectInput(updates, { partial: true });
        if (errors.length > 0) {
            return NextResponse.json({ error: 'Invalid project', details: errors }, { status: 400 });
        }

        const result = await withDbMutation(async () => {
            const projects = await readDb();
            const index = projects.findIndex(p => p.id === id);
            if (index === -1) return null;

            projects[index] = {
                ...projects[index],
                ...preserveRedactedSecrets(projects[index], value),
                id: projects[index].id,
                createdAt: projects[index].createdAt,
            };
            await writeDb(projects);
            return projects;
        });

        if (!result) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        return NextResponse.json(publicProjects(result, { includeSecrets: can(auth.session, 'projects.write') }));
    } catch (error) {
        console.error(`[API] PUT Error:`, error);
        return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const auth = await requirePermission('projects.write');
        if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
        const { id } = await params;
        const result = await withDbMutation(async () => {
            const projects = await readDb();
            const filteredProjects = projects.filter(p => p.id !== id);
            if (filteredProjects.length === projects.length) return null;
            await writeDb(filteredProjects);
            return filteredProjects;
        });

        if (!result) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        return NextResponse.json(publicProjects(result, { includeSecrets: can(auth.session, 'projects.write') }));
    } catch (error) {
        console.error(`[API] DELETE Error:`, error);
        return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
    }
}

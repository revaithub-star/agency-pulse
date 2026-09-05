import { NextResponse } from 'next/server';
import { readDb, withDbMutation, writeDb } from '@/lib/db';
import { normalizeProjectInput, publicProject, publicProjects } from '@/lib/projectSchema';
import { requirePermission } from '@/lib/access';
import { can } from '@/lib/permissions';

export async function GET() {
    try {
        const auth = await requirePermission('projects.read');
        if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
        const projects = await readDb();
        const includeSecrets = can(auth.session, 'projects.write');
        return NextResponse.json(publicProjects(projects, { includeSecrets }));
    } catch (error) {
        console.error('[API] GET Projects Error:', error);
        return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const auth = await requirePermission('projects.write');
        if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
        const project = await request.json();
        const { value, errors } = normalizeProjectInput(project);
        if (errors.length > 0) {
            return NextResponse.json({ error: 'Invalid project', details: errors }, { status: 400 });
        }

        const newProject = await withDbMutation(async () => {
            const projects = await readDb();
            const createdProject = {
                ...value,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
            };
            projects.push(createdProject);
            await writeDb(projects);
            return createdProject;
        });

        return NextResponse.json(publicProject(newProject, { includeSecrets: true }), { status: 201 });
    } catch (error) {
        console.error('[API] POST Project Error:', error);
        return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';

export async function GET() {
    try {
        const projects = await readDb();
        return NextResponse.json(projects);
    } catch (error) {
        console.error('[API] GET Projects Error:', error);
        return NextResponse.json({ error: 'Failed to fetch projects', details: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const project = await request.json();
        const projects = await readDb();

        const newProject = {
            ...project,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
        };

        projects.push(newProject);
        await writeDb(projects);

        console.log(`[API] POST: Project ${newProject.id} created successfully`);
        return NextResponse.json(newProject);
    } catch (error) {
        console.error('[API] POST Project Error:', error);
        return NextResponse.json({ error: 'Failed to create project', details: error.message }, { status: 500 });
    }
}


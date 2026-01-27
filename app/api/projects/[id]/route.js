import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const updates = await request.json();
        const projects = await readDb();

        const index = projects.findIndex(p => p.id === id);
        if (index === -1) {
            console.error(`[API] PUT: Project ${id} not found`);
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        projects[index] = { ...projects[index], ...updates };
        await writeDb(projects);

        console.log(`[API] PUT: Project ${id} updated successfully`);
        return NextResponse.json(projects);
    } catch (error) {
        console.error(`[API] PUT Error:`, error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const projects = await readDb();

        const initialLength = projects.length;
        const filteredProjects = projects.filter(p => p.id !== id);

        if (filteredProjects.length === initialLength) {
            console.warn(`[API] DELETE: Project ${id} not found for deletion`);
        }

        await writeDb(filteredProjects);

        console.log(`[API] DELETE: Project ${id} removed successfully`);
        return NextResponse.json(filteredProjects);
    } catch (error) {
        console.error(`[API] DELETE Error:`, error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}


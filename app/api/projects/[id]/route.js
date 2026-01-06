import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';

export async function PUT(request, { params }) {
    const { id } = await params;
    const updates = await request.json();
    const projects = await readDb();
    
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    projects[index] = { ...projects[index], ...updates };
    await writeDb(projects);
    
    return NextResponse.json(projects);
}

export async function DELETE(request, { params }) {
    const { id } = await params;
    const projects = await readDb();
    
    const filteredProjects = projects.filter(p => p.id !== id);
    await writeDb(filteredProjects);
    
    return NextResponse.json(filteredProjects);
}

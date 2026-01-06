import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';

export async function GET() {
    const projects = await readDb();
    return NextResponse.json(projects);
}

export async function POST(request) {
    const project = await request.json();
    const projects = await readDb();
    
    const newProject = {
        ...project,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
    };
    
    projects.push(newProject);
    await writeDb(projects);
    
    return NextResponse.json(newProject);
}

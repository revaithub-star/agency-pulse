import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getDatabaseConnection } from '@/lib/db';
import { requirePermission } from '@/lib/access';

export async function GET() {
    const auth = await requirePermission('projects.read');
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const rows = getDatabaseConnection().prepare('SELECT id, name, created_at AS createdAt, updated_at AS updatedAt FROM project_categories ORDER BY name COLLATE NOCASE').all();
    return NextResponse.json(rows);
}

export async function POST(request) {
    const auth = await requirePermission('projects.write');
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const body = await request.json();
    const name = String(body.name || '').trim();
    if (!name) return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    try {
        getDatabaseConnection().prepare('INSERT INTO project_categories (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)').run(id, name, now, now);
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return NextResponse.json({ error: 'A category with that name already exists' }, { status: 409 });
        }
        throw error;
    }
    return NextResponse.json({ id, name, createdAt: now, updatedAt: now }, { status: 201 });
}

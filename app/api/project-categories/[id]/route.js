import { NextResponse } from 'next/server';
import { getDatabaseConnection } from '@/lib/db';
import { requirePermission } from '@/lib/access';

export async function PUT(request, { params }) {
    const auth = await requirePermission('projects.write');
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { id } = await params;
    const body = await request.json();
    const name = String(body.name || '').trim();
    if (!name) return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    const now = new Date().toISOString();
    try {
        const result = getDatabaseConnection().prepare('UPDATE project_categories SET name = ?, updated_at = ? WHERE id = ?').run(name, now, id);
        if (!result.changes) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return NextResponse.json({ error: 'A category with that name already exists' }, { status: 409 });
        }
        throw error;
    }
    const updated = getDatabaseConnection().prepare('SELECT id, name, created_at AS createdAt, updated_at AS updatedAt FROM project_categories WHERE id = ?').get(id);
    return NextResponse.json(updated);
}

export async function DELETE(request, { params }) {
    const auth = await requirePermission('projects.write');
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { id } = await params;
    const db = getDatabaseConnection();
    const category = db.prepare('SELECT name FROM project_categories WHERE id = ?').get(id);
    if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    const inUse = db.prepare('SELECT COUNT(*) AS count FROM projects WHERE category = ?').get(category.name).count > 0;
    if (inUse) {
        return NextResponse.json({ error: 'Cannot delete category: it is currently used by one or more projects' }, { status: 400 });
    }
    db.prepare('DELETE FROM project_categories WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
}

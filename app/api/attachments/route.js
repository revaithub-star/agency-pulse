import crypto from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import { getDatabaseConnection } from '@/lib/db';
import { requirePermission } from '@/lib/access';

const maxSize = 10 * 1024 * 1024;
const uploadDirectory = process.env.UPLOADS_DIRECTORY || path.join(process.cwd(), 'data', 'uploads');

export async function POST(request) {
    const auth = await requirePermission('projects.write');
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const form = await request.formData();
    const projectId = String(form.get('projectId') || '');
    const file = form.get('file');
    if (!projectId || !file || typeof file.arrayBuffer !== 'function') return NextResponse.json({ error: 'Project and file are required' }, { status: 400 });
    if (file.size > maxSize) return NextResponse.json({ error: 'Attachments must be 10 MB or smaller' }, { status: 400 });
    const db = getDatabaseConnection();
    if (!db.prepare('SELECT 1 FROM projects WHERE id = ?').get(projectId)) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    const id = crypto.randomUUID();
    const storedName = `${id}-${String(file.name || 'attachment').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(path.join(uploadDirectory, storedName), Buffer.from(await file.arrayBuffer()));
    const createdAt = new Date().toISOString();
    db.prepare(`INSERT INTO attachments (id, project_id, original_name, stored_name, mime_type, size_bytes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(id, projectId, file.name || 'attachment', storedName, file.type || 'application/octet-stream', file.size, createdAt);
    return NextResponse.json({ id, projectId, name: file.name, mimeType: file.type, sizeBytes: file.size, createdAt }, { status: 201 });
}
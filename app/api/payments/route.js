import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getDatabaseConnection } from '@/lib/db';
import { requirePermission } from '@/lib/access';
import { financialRecord } from '@/lib/financial';

export async function GET(request) {
    const auth = await requirePermission('financials.read');
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const projectId = new URL(request.url).searchParams.get('projectId');
    const rows = getDatabaseConnection().prepare(`SELECT * FROM payments ${projectId ? 'WHERE project_id = ?' : ''} ORDER BY paid_at DESC`).all(...(projectId ? [projectId] : []));
    return NextResponse.json(rows);
}

export async function POST(request) {
    const auth = await requirePermission('financials.write');
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const body = await request.json();
    const parsed = financialRecord(body);
    if (parsed.error || !body.projectId) return NextResponse.json({ error: parsed.error || 'Project is required' }, { status: 400 });
    const db = getDatabaseConnection();
    const project = db.prepare('SELECT client_id FROM projects WHERE id = ?').get(body.projectId);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    const record = { id: crypto.randomUUID(), projectId: body.projectId, clientId: project.client_id, ...parsed, status: String(body.status || 'received'), notes: String(body.notes || '').trim() };
    db.prepare(`INSERT INTO payments (id, project_id, client_id, amount_minor, currency, paid_at, status, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(record.id, record.projectId, record.clientId, record.amountMinor, record.currency, record.date, record.status, record.notes, new Date().toISOString());
    return NextResponse.json(record, { status: 201 });
}
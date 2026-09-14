import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getDatabaseConnection } from '@/lib/db';
import { requirePermission } from '@/lib/access';
import { financialRecord } from '@/lib/financial';

export async function GET(request) {
    const auth = await requirePermission('financials.read');
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const projectId = new URL(request.url).searchParams.get('projectId');
    const rows = getDatabaseConnection().prepare(`SELECT * FROM expenses ${projectId ? 'WHERE project_id = ?' : ''} ORDER BY spent_at DESC`).all(...(projectId ? [projectId] : []));
    const result = rows.map(r => ({ ...r, title: r.category }));
    return NextResponse.json(result);
}

export async function POST(request) {
    const auth = await requirePermission('financials.write');
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const body = await request.json();
    const parsed = financialRecord(body, 'spentAt');
    const title = String(body.title || body.category || '').trim();
    if (parsed.error || !title) return NextResponse.json({ error: parsed.error || 'Expense title is required' }, { status: 400 });
    const record = { id: crypto.randomUUID(), projectId: body.projectId || null, ...parsed, title, category: title, notes: String(body.notes || '').trim() };
    getDatabaseConnection().prepare(`INSERT INTO expenses (id, project_id, category, amount_minor, currency, spent_at, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(record.id, record.projectId, record.title, record.amountMinor, record.currency, record.date, record.notes, new Date().toISOString());
    return NextResponse.json(record, { status: 201 });
}
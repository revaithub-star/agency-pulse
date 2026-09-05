import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getDatabaseConnection } from '@/lib/db';
import { requirePermission } from '@/lib/access';

const clientSelect = `
    SELECT c.*, COUNT(DISTINCT p.id) AS project_count,
        COALESCE(SUM(DISTINCT p.amount_minor), 0) AS agreed_minor,
        COALESCE((SELECT SUM(amount_minor) FROM payments WHERE client_id = c.id AND status = 'received'), 0) AS paid_minor
    FROM clients c LEFT JOIN projects p ON p.client_id = c.id
`;

function serialize(row) {
    return {
        id: row.id, name: row.name, email: row.email, phone: row.phone,
        company: row.company, address: row.address || '', notes: row.notes,
        totalRevenueMinor: row.agreed_minor || 0,
        outstandingMinor: Math.max((row.agreed_minor || 0) - (row.paid_minor || 0), 0),
        projectCount: row.project_count || 0,
        createdAt: row.created_at, updatedAt: row.updated_at,
    };
}

export async function GET() {
    const auth = await requirePermission('clients.read');
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const rows = getDatabaseConnection().prepare(`${clientSelect} GROUP BY c.id ORDER BY c.name`).all();
    return NextResponse.json(rows.map(serialize));
}

export async function POST(request) {
    const auth = await requirePermission('clients.write');
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const body = await request.json();
    const name = String(body.name || '').trim();
    if (!name) return NextResponse.json({ error: 'Full Name is required' }, { status: 400 });
    const email = String(body.email || '').trim();
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
        return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }
    const now = new Date().toISOString();
    const client = {
        id: crypto.randomUUID(), name,
        email,
        phone: String(body.contact || body.phone || '').trim(),
        company: String(body.company || '').trim(),
        address: String(body.address || '').trim(),
        notes: String(body.notes || '').trim(),
    };
    getDatabaseConnection().prepare(`INSERT INTO clients (id, name, email, phone, company, address, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(client.id, client.name, client.email, client.phone, client.company, client.address, client.notes, now, now);
    return NextResponse.json({ ...client, totalRevenueMinor: 0, outstandingMinor: 0, projectCount: 0, createdAt: now, updatedAt: now }, { status: 201 });
}
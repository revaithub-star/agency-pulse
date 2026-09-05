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

export async function GET(request, { params }) {
    const auth = await requirePermission('clients.read');
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { id } = await params;
    const db = getDatabaseConnection();
    const client = db.prepare(`${clientSelect} WHERE c.id = ? GROUP BY c.id`).get(id);
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    const projects = db.prepare('SELECT id, project_name AS projectName, amount_minor AS agreedAmountMinor, currency, status, date FROM projects WHERE client_id = ? ORDER BY date DESC').all(id);
    return NextResponse.json({ ...serialize(client), projects });
}

export async function PUT(request, { params }) {
    const auth = await requirePermission('clients.write');
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { id } = await params;
    const body = await request.json();
    const email = String(body.email || '').trim();
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
        return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }
    const db = getDatabaseConnection();
    const existing = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    if (!existing) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const name = String(body.name || existing.name || '').trim();
    if (!name) return NextResponse.json({ error: 'Full Name is required' }, { status: 400 });

    const result = db.prepare(`
        UPDATE clients SET
            name = ?,
            email = ?,
            phone = ?,
            company = ?,
            address = ?,
            notes = ?,
            updated_at = ?
        WHERE id = ?
    `).run(
        name,
        email,
        String(body.contact || body.phone || existing.phone || '').trim(),
        String(body.company || existing.company || '').trim(),
        String(body.address || existing.address || '').trim(),
        String(body.notes || existing.notes || '').trim(),
        new Date().toISOString(),
        id
    );
    if (!result.changes) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    const updated = db.prepare(`${clientSelect} WHERE c.id = ? GROUP BY c.id`).get(id);
    return NextResponse.json(serialize(updated));
}

export async function DELETE(request, { params }) {
    const auth = await requirePermission('clients.write');
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { id } = await params;
    const db = getDatabaseConnection();
    const existing = db.prepare('SELECT id FROM clients WHERE id = ?').get(id);
    if (!existing) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    const inUse = db.prepare('SELECT COUNT(*) AS count FROM projects WHERE client_id = ?').get(id).count > 0;
    if (inUse) {
        return NextResponse.json({ error: 'Cannot delete client: they are linked to one or more projects. Unlink them first.' }, { status: 400 });
    }
    db.prepare('DELETE FROM clients WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
}

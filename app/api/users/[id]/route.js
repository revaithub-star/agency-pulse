import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getDatabaseConnection } from '@/lib/db';
import { requirePermission } from '@/lib/access';

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `scrypt:${salt}:${hash}`;
}

function serializeUser(row) {
    return {
        id: row.id,
        email: row.email,
        role: row.role,
        permissions: JSON.parse(row.permissions_json || '[]'),
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export async function GET(request, { params }) {
    const auth = await requirePermission('users.manage');
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { id } = await params;
    const row = getDatabaseConnection().prepare('SELECT id, email, role, permissions_json, is_active, created_at, updated_at FROM users WHERE id = ?').get(id);
    if (!row) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json(serializeUser(row));
}

export async function PUT(request, { params }) {
    const auth = await requirePermission('users.manage');
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { id } = await params;
    const body = await request.json();
    const db = getDatabaseConnection();

    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const email = String(body.email || existing.email || '').trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        return NextResponse.json({ error: 'Use a valid email address' }, { status: 400 });
    }

    const role = ['admin', 'staff'].includes(body.role) ? body.role : existing.role;
    const permissions = Array.isArray(body.permissions) ? body.permissions : JSON.parse(existing.permissions_json || '[]');
    const isActive = typeof body.isActive === 'boolean' ? (body.isActive ? 1 : 0) : existing.is_active;

    const now = new Date().toISOString();
    const fields = ['email = ?', 'role = ?', 'permissions_json = ?', 'is_active = ?', 'updated_at = ?'];
    const paramsArr = [email, role, JSON.stringify(permissions), isActive, now];

    if (body.password && String(body.password).length >= 8) {
        fields.push(', password_hash = ?');
        paramsArr.push(hashPassword(String(body.password)));
    } else if (body.password) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    try {
        const result = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...paramsArr, id);
        if (!result.changes) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return NextResponse.json({ error: 'A user with that email already exists' }, { status: 409 });
        }
        throw error;
    }

    const updated = db.prepare('SELECT id, email, role, permissions_json, is_active, created_at, updated_at FROM users WHERE id = ?').get(id);
    return NextResponse.json(serializeUser(updated));
}

export async function DELETE(request, { params }) {
    const auth = await requirePermission('users.manage');
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { id } = await params;
    const db = getDatabaseConnection();
    const existing = db.prepare('SELECT id, role FROM users WHERE id = ?').get(id);
    if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (existing.role === 'admin') {
        const adminCount = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND is_active = 1").get().count;
        if (adminCount <= 1) {
            return NextResponse.json({ error: 'Cannot delete the last active administrator' }, { status: 400 });
        }
    }
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
}

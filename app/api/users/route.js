import { NextResponse } from 'next/server';
import { createUser } from '@/lib/auth';
import { getDatabaseConnection } from '@/lib/db';
import { requirePermission } from '@/lib/access';

export async function GET() {
    const auth = await requirePermission('users.manage');
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const rows = getDatabaseConnection().prepare('SELECT id, email, role, permissions_json AS permissions, is_active AS isActive, created_at AS createdAt FROM users ORDER BY email').all().map(row => ({ ...row, permissions: JSON.parse(row.permissions || '[]') }));
    return NextResponse.json(rows);
}

export async function POST(request) {
    const auth = await requirePermission('users.manage');
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) return NextResponse.json({ error: 'Use a valid email and a password of at least 8 characters' }, { status: 400 });
    try {
        const user = createUser({ email, password, role: 'staff', permissions: Array.isArray(body.permissions) ? body.permissions : [] });
        return NextResponse.json({ id: user.id, email: user.email, role: user.role, permissions: user.permissions }, { status: 201 });
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return NextResponse.json({ error: 'A user with that email already exists' }, { status: 409 });
        throw error;
    }
}
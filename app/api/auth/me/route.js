import { NextResponse } from 'next/server';
import { getDatabaseConnection } from '@/lib/db';
import { getSession, getUserById } from '@/lib/auth';

export async function GET() {
    const session = await getSession();
    if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });

    if (session.userId === 'environment-admin') {
        return NextResponse.json({
            authenticated: true,
            email: session.email,
            role: 'admin',
            permissions: ['*'],
        });
    }

    const user = getUserById(session.userId);
    if (!user || !user.is_active) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    let permissions = [];
    try {
        permissions = JSON.parse(user.permissions_json || '[]');
    } catch {
        permissions = [];
    }

    return NextResponse.json({
        authenticated: true,
        id: user.id,
        email: user.email,
        role: user.role,
        permissions,
    });
}

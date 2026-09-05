import { NextResponse } from 'next/server';
import { createSession, createUser, getUserCount } from '@/lib/auth';

export async function POST(request) {
    try {
        if (getUserCount() > 0) {
            return NextResponse.json({ error: 'Admin signup is already closed' }, { status: 403 });
        }

        const body = await request.json();
        const email = String(body.email || '').trim().toLowerCase();
        const password = String(body.password || '');
        if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
            return NextResponse.json({ error: 'Use a valid email and a password of at least 8 characters' }, { status: 400 });
        }

        const user = createUser({ email, password, role: 'admin', permissions: ['*'] });
        await createSession(user);
        return NextResponse.json({ authenticated: true, email: user.email, role: user.role }, { status: 201 });
    } catch (error) {
        console.error('[API] Signup error:', error.message);
        return NextResponse.json({ error: 'Unable to create the admin account' }, { status: 500 });
    }
}
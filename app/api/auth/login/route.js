import { NextResponse } from 'next/server';
import { createSession, verifyAdminCredentials, verifyUserCredentials } from '@/lib/auth';

export async function POST(request) {
    try {
        const body = await request.json();
        const user = verifyUserCredentials(body.email, body.password);
        const legacyAdmin = !user && verifyAdminCredentials(body.email, body.password);
        if (!user && !legacyAdmin) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        await createSession(user || {
            id: 'environment-admin',
            email: body.email,
            role: 'admin',
            permissions: ['*'],
        });
        return NextResponse.json({ authenticated: true, role: user?.role || 'admin' });
    } catch (error) {
        console.error('[API] Login error:', error.message);
        return NextResponse.json({ error: 'Unable to sign in' }, { status: 500 });
    }
}
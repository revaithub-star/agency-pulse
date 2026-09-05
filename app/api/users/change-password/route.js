import { NextResponse } from 'next/server';
import { getSession, getUserById } from '@/lib/auth';
import { getDatabaseConnection } from '@/lib/db';
import crypto from 'crypto';

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
    const [algorithm, salt, hash] = String(storedHash || '').split(':');
    if (algorithm !== 'scrypt' || !salt || !hash || typeof password !== 'string') return false;
    const supplied = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, 'hex');
    return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}

export async function POST(req) {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { currentPassword, newPassword } = body;

        if (!newPassword || newPassword.length < 8) {
            return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
        }

        const db = getDatabaseConnection();
        const user = db.prepare('SELECT id, password_hash FROM users WHERE id = ?').get(session.userId);

        if (!user || !verifyPassword(currentPassword, user.password_hash)) {
            return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
        }

        const newHash = hashPassword(newPassword);
        db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
          .run(newHash, new Date().toISOString(), session.userId);

        return NextResponse.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.error('[ChangePassword] Error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

import crypto from 'crypto';
import { cookies } from 'next/headers';
import { getDatabaseConnection } from '@/lib/db';

const cookieName = 'agency-pulse-session';
const sessionDuration = 1000 * 60 * 60 * 24 * 7;

const defaultPermissions = [
    'projects.read', 'projects.write', 'clients.read', 'clients.write',
    'financials.read', 'financials.write', 'reports.read'
];

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

function getSecret() {
    return process.env.AUTH_SECRET || process.env.SESSION_SECRET;
}

function sign(value) {
    const secret = getSecret();
    if (!secret) throw new Error('AUTH_SECRET is not configured');
    return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function encodeSession(session) {
    const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
    return `${payload}.${sign(payload)}`;
}

function decodeSession(value) {
    if (!value) return null;

    const [payload, signature] = value.split('.');
    if (!payload || !signature) return null;

    const expected = sign(payload);
    const suppliedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (suppliedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)) return null;

    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return session.expiresAt > Date.now() ? session : null;
}

export function getAdminIdentity() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) return null;
    return { email: email.toLowerCase(), password };
}

export function verifyAdminCredentials(email, password) {
    const admin = getAdminIdentity();
    if (!admin || typeof email !== 'string' || typeof password !== 'string') return false;

    const supplied = Buffer.from(password);
    const expected = Buffer.from(admin.password);
    return email.trim().toLowerCase() === admin.email &&
        supplied.length === expected.length &&
        crypto.timingSafeEqual(supplied, expected);
}

export function getUserByEmail(email) {
    return getDatabaseConnection().prepare(`
        SELECT id, name, email, password_hash, role, permissions_json, is_active FROM users WHERE email = ?
    `).get(String(email || '').trim().toLowerCase());
}

export function getUserById(id) {
    return getDatabaseConnection().prepare(`
        SELECT id, name, email, role, permissions_json, is_active FROM users WHERE id = ?
    `).get(id);
}

export function getUserCount() {
    return getDatabaseConnection().prepare('SELECT COUNT(*) AS count FROM users').get().count;
}

export function createUser({ name = '', email, password, role = 'staff', permissions = defaultPermissions }) {
    const now = new Date().toISOString();
    const user = {
        id: crypto.randomUUID(),
        name: String(name || '').trim(),
        email: String(email).trim().toLowerCase(),
        passwordHash: hashPassword(password),
        role,
        permissions,
    };
    getDatabaseConnection().prepare(`
        INSERT INTO users (id, name, email, password_hash, role, permissions_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(user.id, user.name, user.email, user.passwordHash, user.role, JSON.stringify(user.permissions), now, now);
    return user;
}

export function verifyUserCredentials(email, password) {
    const user = getUserByEmail(email);
    if (!user || !user.is_active || !verifyPassword(password, user.password_hash)) return null;
    return {
        id: user.id,
        name: user.name || '',
        email: user.email,
        role: user.role,
        permissions: JSON.parse(user.permissions_json || '[]'),
    };
}

export async function createSession(user) {
    const cookieStore = await cookies();
    cookieStore.set(cookieName, encodeSession({
        userId: user.id,
        email: user.email.toLowerCase(),
        role: user.role,
        permissions: user.permissions || [],
        expiresAt: Date.now() + sessionDuration,
    }), {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: sessionDuration / 1000,
    });
}

export async function clearSession() {
    const cookieStore = await cookies();
    cookieStore.delete(cookieName);
}

export async function getSession() {
    try {
        const cookieStore = await cookies();
        const session = decodeSession(cookieStore.get(cookieName)?.value);
        if (!session) return null;
        if (session.userId === 'environment-admin') {
            return { ...session, role: 'admin', permissions: ['*'] };
        }
        const user = getUserById(session.userId);
        if (!user || !user.is_active) return null;
        let permissions = [];
        try {
            permissions = JSON.parse(user.permissions_json || '[]');
        } catch {
            permissions = [];
        }
        return {
            ...session,
            email: user.email,
            role: user.role,
            permissions,
        };
    } catch (error) {
        console.error('[Auth] Invalid session:', error.message);
        return null;
    }
}

export async function requireSession() {
    const session = await getSession();
    return session ? { session } : null;
}
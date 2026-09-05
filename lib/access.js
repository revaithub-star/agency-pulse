import { getSession } from '@/lib/auth';

export async function requirePermission(permission) {
    const session = await getSession();
    if (!session) return { error: 'Authentication required', status: 401 };
    if (session.role !== 'admin' && !session.permissions?.includes('*') && !session.permissions?.includes(permission)) {
        return { error: 'Permission denied', status: 403 };
    }
    return { session };
}
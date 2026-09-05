import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDatabaseConnection } from '@/lib/db';
import { writeFileSync } from 'fs';
import path from 'path';

export async function POST() {
    try {
        const session = await getSession();
        if (!session?.userId || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const db = getDatabaseConnection();
        db.transaction(() => {
            db.prepare('DELETE FROM attachments').run();
            db.prepare('DELETE FROM expenses').run();
            db.prepare('DELETE FROM payments').run();
            db.prepare('DELETE FROM projects').run();
            db.prepare('DELETE FROM clients').run();
        })();

        // Reset db.json as well
        const legacyFilePath = path.join(process.cwd(), 'data', 'db.json');
        writeFileSync(legacyFilePath, '[]', 'utf8');

        return NextResponse.json({ success: true, message: 'All workspace data has been cleared.' });
    } catch (err) {
        console.error('[ResetData] Error:', err);
        return NextResponse.json({ error: 'Failed to reset workspace data' }, { status: 500 });
    }
}

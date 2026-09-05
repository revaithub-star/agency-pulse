import { readFile, unlink } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import { getDatabaseConnection } from '@/lib/db';
import { requirePermission } from '@/lib/access';

const uploadDirectory = process.env.UPLOADS_DIRECTORY || path.join(process.cwd(), 'data', 'uploads');

export async function GET(request, { params }) {
    const auth = await requirePermission('projects.read');
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { id } = await params;
    const attachment = getDatabaseConnection().prepare('SELECT * FROM attachments WHERE id = ?').get(id);
    if (!attachment) return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    try {
        const content = await readFile(path.join(uploadDirectory, attachment.stored_name));
        return new NextResponse(content, { headers: { 'Content-Type': attachment.mime_type, 'Content-Disposition': `attachment; filename="${attachment.original_name.replaceAll('"', '')}"` } });
    } catch {
        return NextResponse.json({ error: 'Attachment file is unavailable' }, { status: 404 });
    }
}

export async function DELETE(request, { params }) {
    const auth = await requirePermission('projects.write');
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { id } = await params;
    const db = getDatabaseConnection();
    const attachment = db.prepare('SELECT stored_name FROM attachments WHERE id = ?').get(id);
    if (!attachment) return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    db.prepare('DELETE FROM attachments WHERE id = ?').run(id);
    await unlink(path.join(uploadDirectory, attachment.stored_name)).catch(() => undefined);
    return NextResponse.json({ deleted: true });
}
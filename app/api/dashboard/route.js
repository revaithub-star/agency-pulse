import { NextResponse } from 'next/server';
import { getDatabaseConnection } from '@/lib/db';
import { requirePermission } from '@/lib/access';

export async function GET() {
    const auth = await requirePermission('reports.read');
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const db = getDatabaseConnection();
    const projects = db.prepare(`SELECT COUNT(*) AS total, SUM(status = 'In Progress') AS active, SUM(status = 'Completed') AS completed FROM projects`).get();
    const financials = db.prepare(`SELECT currency, COALESCE((SELECT SUM(amount_minor) FROM projects p2 WHERE p2.currency = p.currency), 0) AS revenue_minor, COALESCE((SELECT SUM(amount_minor) FROM expenses e WHERE e.currency = p.currency), 0) AS expense_minor, COALESCE((SELECT SUM(amount_minor) FROM payments pay WHERE pay.currency = p.currency AND pay.status = 'received'), 0) AS paid_minor FROM projects p GROUP BY currency`).all();
    const outstanding = financials.map((row) => ({ currency: row.currency, outstandingMinor: Math.max(row.revenue_minor - row.paid_minor, 0), revenueMinor: row.revenue_minor, expenseMinor: row.expense_minor, netProfitMinor: row.revenue_minor - row.expense_minor }));
    const monthlyRevenue = db.prepare(`SELECT substr(paid_at, 1, 7) AS month, currency, SUM(amount_minor) AS amountMinor FROM payments WHERE status = 'received' GROUP BY month, currency ORDER BY month`).all();
    return NextResponse.json({ projects, financials: outstanding, monthlyRevenue });
}
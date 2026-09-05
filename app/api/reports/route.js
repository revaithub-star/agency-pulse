import { NextResponse } from 'next/server';
import { getDatabaseConnection } from '@/lib/db';
import { requirePermission } from '@/lib/access';

function csvValue(value) {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export async function GET(request) {
    const auth = await requirePermission('reports.read');
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const search = new URL(request.url).searchParams;
    const from = search.get('from') || '0000-01-01';
    const to = search.get('to') || '9999-12-31';
    const format = search.get('format');
    const db = getDatabaseConnection();
    const revenue = db.prepare(`SELECT p.id, p.project_name AS projectName, c.name AS client, p.currency, p.amount_minor AS agreedAmountMinor, COALESCE((SELECT SUM(amount_minor) FROM payments WHERE project_id = p.id AND status = 'received' AND paid_at BETWEEN ? AND ?), 0) AS paidAmountMinor FROM projects p LEFT JOIN clients c ON c.id = p.client_id`).all(from, to);
    const expenses = db.prepare(`SELECT e.id, e.category, e.currency, e.amount_minor AS amountMinor, e.spent_at AS spentAt, p.project_name AS projectName FROM expenses e LEFT JOIN projects p ON p.id = e.project_id WHERE e.spent_at BETWEEN ? AND ? ORDER BY e.spent_at DESC`).all(from, to);
    const report = { from, to, revenue, expenses, totals: revenue.reduce((result, row) => { const current = result[row.currency] || { revenueMinor: 0, paidMinor: 0, expenseMinor: 0 }; current.revenueMinor += row.agreedAmountMinor; current.paidMinor += row.paidAmountMinor; result[row.currency] = current; return result; }, {}) };
    for (const expense of expenses) report.totals[expense.currency] = { ...(report.totals[expense.currency] || { revenueMinor: 0, paidMinor: 0 }), expenseMinor: (report.totals[expense.currency]?.expenseMinor || 0) + expense.amountMinor };
    if (format === 'csv') {
        const lines = [['type', 'name', 'client/category', 'currency', 'amountMinor', 'date'], ...revenue.map(row => ['revenue', row.projectName, row.client || '', row.currency, row.agreedAmountMinor, from]), ...expenses.map(row => ['expense', row.projectName || '', row.category, row.currency, row.amountMinor, row.spentAt])];
        return new NextResponse(lines.map(line => line.map(csvValue).join(',')).join('\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="agency-report-${from}-${to}.csv"` } });
    }
    return NextResponse.json(report);
}
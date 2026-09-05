export function amountToMinor(value) {
    const amount = typeof value === 'number' ? value : Number(String(value || '').trim());
    return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) : null;
}

export function financialRecord(body, field = 'paidAt') {
    const amountMinor = amountToMinor(body.amount);
    if (amountMinor === null) return { error: 'Amount must be a non-negative number' };
    const date = String(body[field] || body.date || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: 'Date must use YYYY-MM-DD format' };
    return { amountMinor, date, currency: String(body.currency || 'USD').trim().toUpperCase() };
}
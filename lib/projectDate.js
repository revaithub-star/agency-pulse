import { isValid, parseISO } from 'date-fns';

export function parseProjectDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = parseISO(value);
    return isValid(date) ? date : null;
}
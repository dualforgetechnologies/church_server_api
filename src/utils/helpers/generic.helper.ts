import jwt from 'jsonwebtoken';

export function convertDateToIso(dateStr: string): string {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        throw new Error('Invalid date format. Expected "YYYY-MM-DD".');
    }

    const prismaDateTime = `${dateStr}T00:00:00.000Z`;
    return prismaDateTime;
}

export function generateSlug(title: string): string {
    const slug = title.toLowerCase().replace(/\s+/g, '-');

    const cleanedSlug = slug.replace(/[^\w\-]/g, '');

    return cleanedSlug;
}

export function parseEnum<T extends Record<string, string | number>>(
    value: unknown,
    enumType: T,
): T[keyof T] | undefined {
    return Object.values(enumType).includes(value as T[keyof T]) ? (value as T[keyof T]) : undefined;
}

const PDF_SECRET = process.env.PDF_TOKEN_SECRET || 'yourStrongSecret';

export function generateInvoicePdfToken(invoiceId: string): string {
    return jwt.sign({ invoiceId }, PDF_SECRET, { expiresIn: '10m' });
}

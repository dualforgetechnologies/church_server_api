import ms from 'ms';

interface ExpiryMeta {
    expiresAt: Date;
    stringValue: string;
    humanReadable: string;
    duration: ms.StringValue;
}

/**
 * Converts a duration string into expiry metadata.
 *
 * @param duration Duration string (e.g. "15m", "2h", "1d")
 * @returns Expiry metadata including raw date, ms, string, and readable format
 */
export function getExpiryDateFromNow(duration: ms.StringValue, startDate: Date = new Date()): ExpiryMeta {
    const milliseconds = ms(duration);

    if (typeof milliseconds !== 'number') {
        throw new Error(`Invalid duration string: "${duration}"`);
    }

    const expiresAt = new Date(startDate.getTime() + milliseconds);

    const stringValue = ms(milliseconds, { long: true }); // e.g. "15 minutes"

    const humanReadable = `${expiresAt.toLocaleString('en-US', {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    })} UTC`;

    return {
        expiresAt,
        stringValue,
        humanReadable,
        duration,
    };
}

export function isValidHtml(input: unknown): input is string {
    return typeof input === 'string' && input.trim().length > 0 && /<\/?[a-z][\s\S]*>/i.test(input);
}

export function formatReadableLabel(value: string): string {
    return value
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
type ValueReason = { type: string; reason: string };
type ValueReasonArrays = { value: string[]; reason: string[] };

export function transformToArrays<T extends ValueReason>(data: T[]): ValueReasonArrays {
    return data.reduce(
        (acc, curr) => {
            acc.value.push(curr.type);
            acc.reason.push(curr.reason);
            return acc;
        },
        { value: [] as string[], reason: [] as string[] },
    );
}

export function safeJsonParse<T = unknown>(value: string): T | string {
    try {
        return JSON.parse(value) as T;
    } catch {
        return value;
    }
}

export function parsedObject<T extends object>(ctx: unknown, excludeKeys: (keyof T)[] = []): Partial<T> {
    const result: Partial<T> = {};
    const body = ctx as Record<string, unknown>;

    for (const key in body) {
        if (Object.prototype.hasOwnProperty.call(body, key) && !excludeKeys.includes(key as keyof T)) {
            result[key as keyof T] = body[key] as T[keyof T];
        }
    }

    return result;
}

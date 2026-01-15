import { z } from 'zod';

export const preprocessBoolean = (defaultValue?: boolean) => {
    return z.preprocess(
        (val) => {
            if (typeof val === 'string') {
                if (val.toLowerCase() === 'true') {
                    return true;
                }
                if (val.toLowerCase() === 'false') {
                    return false;
                }
            }
            return val;
        },
        defaultValue === undefined ? z.boolean().optional() : z.boolean().default(defaultValue),
    );
};

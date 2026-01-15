import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';

export const ValidationMiddleware = {
    validateRequest: (schema: ZodTypeAny) => {
        return (
            req: Request<Record<string, string>, unknown, unknown, Record<string, unknown>>,
            res: Response,
            next: NextFunction,
        ) => {
            const input = {
                ...Object(req.query),
                ...Object(req.params),
                ...Object(req.body),
            };

            schema
                .parseAsync(input)
                .then(() => next())
                .catch((error) => next(error));
        };
    },
};

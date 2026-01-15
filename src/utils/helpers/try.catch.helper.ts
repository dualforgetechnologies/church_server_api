import { NextFunction, Request, Response } from 'express';

export const tryCatch =
    <T = unknown>(controller: (req: Request, res: Response, next: NextFunction) => Promise<T>) =>
    (req: Request, res: Response, next: NextFunction): void => {
        controller(req, res, next).catch((error) => {
            next(error);
        });
    };

import { NextFunction, Request, Response } from 'express';
import { Controller } from './controller';

type AsyncControllerMethod = () => Promise<unknown>;

type ControllerMethod<T extends Controller> = {
    [K in keyof T]: T[K] extends AsyncControllerMethod ? K : never;
}[keyof T];

export function wrapper<T extends Controller>(
    ControllerClass: new (req: Request, res: Response) => T,
    method: ControllerMethod<T>,
) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const instance = new ControllerClass(req, res);

            const handler = instance[method] as AsyncControllerMethod;
            await handler();
        } catch (error) {
            next(error);
        }
    };
}

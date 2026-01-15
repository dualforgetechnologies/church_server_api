import { ResponseHandler } from '@/utils/helpers';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodType } from 'zod';
import Logger from '../config/logger';
const logger = new Logger('DTOs VALIDATOR');

export const validateBodyDto =
    <T>(schema: ZodType<T>) =>
    (req: Request, res: Response, next: NextFunction) => {
        const response = new ResponseHandler(res);
        const result = schema.safeParse(req.body);
        if (!result.success) {
            logger.error(`BODY_VALIDATION_ERROR: ${result.error}`);
            response.error({
                message: JSON.stringify(result.error.flatten().fieldErrors),
                data: null,
                code: StatusCodes.BAD_REQUEST,
                success: false,
            });
            return;
        }
        req.body = result.data as T;
        next();
    };

export const validateQueryDto =
    <T>(schema: ZodType<T>) =>
    (req: Request, res: Response, next: NextFunction) => {
        const response = new ResponseHandler(res);
        const result = schema.safeParse(req.query);

        if (!result.success) {
            logger.error(`QUERY_VALIDATION_ERROR: ${result.error}`);
            response.error({
                message: JSON.stringify(result.error.flatten().fieldErrors),
                data: null,
                code: StatusCodes.BAD_REQUEST,
                success: false,
            });
            return;
        }

        req.query = result.data as unknown as Request['query'];
        next();
    };

export const validateParamsDto =
    <T>(schema: ZodType<T>) =>
    (req: Request, res: Response, next: NextFunction) => {
        const response = new ResponseHandler(res);
        const result = schema.safeParse(req.params);

        if (!result.success) {
            logger.error(`PARAMS_VALIDATION_ERROR: ${result.error}`);
            response.error({
                message: JSON.stringify(result.error.flatten().fieldErrors),
                data: null,
                code: StatusCodes.BAD_REQUEST,
                success: false,
            });
            return;
        }

        req.params = result.data as unknown as Request['params'];
        next();
    };

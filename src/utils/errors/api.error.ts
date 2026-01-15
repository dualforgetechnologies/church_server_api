import { NextFunction, Request, Response } from 'express';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import { ZodError } from 'zod';
import Logger from '../../config/logger';

const logger = new Logger('ApiError');
export class ApiError extends Error {
    private code: number;
    private details?: unknown;

    constructor(code: number, message: string, details?: unknown) {
        super(message);
        this.code = code;
        this.details = details;

        // Ensure instanceof works
        Object.setPrototypeOf(this, ApiError.prototype);
    }

    /**
     * Express error handler for instance methods.
     */
    appError(err: unknown, req: Request, res: Response, next: NextFunction) {
        const status = 'error';

        if (err instanceof ZodError) {
            const { message } = err;

            this.code = StatusCodes.FORBIDDEN;
            logger.error(`
        Zod validation error:
        status - ${status}
        message - ${message}
        url - ${req.originalUrl}
        method - ${req.method}
        IP - ${req.ip}
        Error Stack - ${err.stack}
      `);

            return res.status(this.code).json({
                message,
                status,
                type: getReasonPhrase(this.code),
            });
        }

        if (err instanceof ApiError) {
            logger.error(`
        API error:
        status - error
        message - ${err.message}
        url - ${req.originalUrl}
        method - ${req.method}
        IP - ${req.ip}
      `);
            return res.status(err.code).json({
                message: err.message,
                status,
                type: getReasonPhrase(err.code),
                error: err.details,
            });
        }

        if (ApiError.isErrorLikeWithCode(err)) {
            const { code, message, details } = err;
            logger.error(`
        API error-like:
        status - error
        message - ${message}
        url - ${req.originalUrl}
        method - ${req.method}
        IP - ${req.ip}
      `);
            return res.status(code).json({
                message: message ?? 'Unknown error',
                status,
                type: getReasonPhrase(code),
                error: details,
            });
        }

        next(err);
    }

    /**
     * Express error handler for static usage.
     */
    static appError(err: unknown, req: Request, res: Response, next: NextFunction) {
        const status = 'error';

        if (err instanceof ZodError) {
            const { message } = err;

            const code = StatusCodes.FORBIDDEN;
            logger.error(`
        Zod validation error:
        status - ${status}
        message - ${message}
        url - ${req.originalUrl}
        method - ${req.method}
        IP - ${req.ip}
        Error Stack - ${err.stack}
      `);

            return res.status(code).json({
                message,
                status,
                type: getReasonPhrase(code),
            });
        }

        if (err instanceof ApiError) {
            logger.error(`
        API error:
        status - error
        message - ${err.message}
        url - ${req.originalUrl}
        method - ${req.method}
        IP - ${req.ip}
      `);
            return res.status(err.code).json({
                message: err.message,
                status,
                type: getReasonPhrase(err.code),
                error: err.details,
            });
        }

        if (ApiError.isErrorLikeWithCode(err)) {
            const { code, message, details } = err;
            logger.error(`
        API error-like:
        status - error
        message - ${message}
        url - ${req.originalUrl}
        method - ${req.method}
        IP - ${req.ip}
      `);
            return res.status(code).json({
                message: message ?? 'Unknown error',
                status,
                type: getReasonPhrase(code),
                error: details,
            });
        }

        next(err);
    }

    /**
     * Generic error handler for unhandled exceptions.
     */
    static genericError(err: unknown, req: Request, res: Response, next: NextFunction) {
        const status = 'error';
        const message = 'An error occurred, we are looking into it.';

        logger.error(`
      Generic error:
      status - ${status}
      message - ${(err as Error)?.message}
      url - ${req.originalUrl}
      method - ${req.method}
      IP - ${req.ip}
    `);

        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message,
            status,
            type: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
        });

        next();
    }

    /**
     * Type guard for error-like objects with a numeric code.
     */
    private static isErrorLikeWithCode(err: unknown): err is { code: number; message?: string; details?: unknown } {
        return (
            typeof err === 'object' &&
            err !== null &&
            'code' in err &&
            typeof (err as { code?: unknown }).code === 'number'
        );
    }
}

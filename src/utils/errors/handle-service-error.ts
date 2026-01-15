import Logger from '@/config/logger';
import { KnownError } from '@/types/types';
import { StatusCodes } from 'http-status-codes';
import { handlePrismaError } from './prisma-error-handler';

export type ServiceError = {
    message: string;
    code: number;
    data?: unknown;
};

function isKnownError(error: unknown): error is KnownError {
    return typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string';
}

export function handleServiceError(params: {
    error: unknown;
    logger: Logger;
    message?: string;
}): ServiceError {
    const { error, logger, message = 'An unexpected service error occurred' } = params;

    const parsedError = handlePrismaError(error);

    logger.error(message, {
        originalError: error,
        parsedError,
    });

    return {
        message: parsedError.message ?? (isKnownError(error) ? error.message : message),
        code: parsedError.code ?? (isKnownError(error) ? error.status : StatusCodes.INTERNAL_SERVER_ERROR),
        data: parsedError.meta ?? (isKnownError(error) ? error.data : undefined),
    };
}

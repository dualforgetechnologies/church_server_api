import Logger from '@/config/logger';
import { AppResponse, KnownError } from '@/types/types';
import { StatusCodes } from 'http-status-codes';
import { handlePrismaError } from '../errors/prisma-error-handler';
import { ResponseHandler } from '../helpers';

function isKnownError(error: unknown): error is KnownError {
    return typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string';
}

/**
 * Unified error handler for try-catch blocks in controllers
 */
export function handleControllerError({
    error,
    response,
    logger,
    message = 'An unexpected error occurred',
}: {
    error: Record<string, string>;
    response?: ResponseHandler;
    logger: Logger;
    message?: string;
}): AppResponse | object {
    const parsedError = handlePrismaError(error);

    logger.error(message, {
        originalError: error,
        parsedError,
    });

    const errorResponse: AppResponse = {
        message: error.message ?? parsedError.message ?? (isKnownError(error) ? error.message : message),
        code: parsedError.code ?? (isKnownError(error) ? error.status : StatusCodes.INTERNAL_SERVER_ERROR),
        data: parsedError.meta ?? (isKnownError(error) ? error.data : undefined),
        success: false,
    };

    return response ? response.error(errorResponse) : errorResponse;
}

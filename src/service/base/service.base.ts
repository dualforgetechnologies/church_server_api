import Logger from '@/config/logger';
import { AppResponse, PaginatedMetaData } from '@/types/types';
import { PrismaClient } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { executeService } from './service.helper';

/**
 * Base service class for all services
 * Provides logging and unified error handling
 */
export abstract class Service {
    protected readonly logger: Logger;
    protected readonly prisma: PrismaClient;

    constructor(logger: Logger) {
        this.logger = logger;
        this.prisma = new PrismaClient();
    }

    /**
     * Wrap an async action with unified error handling
     * @param action The async function to execute
     * @param errorMessage Optional custom error message
     */
    protected run<T>(action: () => Promise<T>, errorMessage?: string): Promise<T> {
        return executeService(action, this.logger, errorMessage);
    }

    /**
     * Create a successful response
     * @param data The response data
     * @param message Optional success message
     * @param code Optional HTTP status code (defaults to 200 OK)
     */
    protected success<T>({
        data,
        pagination,
        message = 'Success',
        code = StatusCodes.OK,
    }: {
        data?: T;
        pagination?: PaginatedMetaData;
        message?: string;
        code?: StatusCodes;
    }): AppResponse<T> {
        return {
            code,
            data,
            message,
            success: true,
            pagination,
        };
    }

    /**
     * Create an error response
     * @param message Error message
     * @param code HTTP status code (defaults to 400 Bad Request)
     * @param data Optional additional error data
     */
    protected error<T = undefined>(
        message: string,
        code: StatusCodes = StatusCodes.BAD_REQUEST,
        data: T = undefined as T,
    ): AppResponse<T> {
        return {
            code,
            data,
            message,
            success: false,
        };
    }

    /**
     * Handle errors (can be overridden by child classes)
     * @param error The error to handle
     * @param context Additional context for error handling
     */
    protected onError(error: Error, context?: string): AppResponse<undefined> {
        this.logger.error(`Error in ${context || 'service'}:`, error);

        return {
            code: StatusCodes.INTERNAL_SERVER_ERROR,
            data: undefined,
            message: 'An internal server error occurred',
            success: false,
        };
    }

    /**
     * Create a standardized "Not Found" response (404)
     * @param message Optional custom message
     */
    protected notFound<T = undefined>(message = 'Resource not found', data: T = undefined as T): AppResponse<T> {
        return {
            code: StatusCodes.NOT_FOUND,
            data,
            message,
            success: false,
        };
    }

    protected async cleanup(): Promise<void> {
        await this.prisma.$disconnect();
    }
}

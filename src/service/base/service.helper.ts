import Logger from '@/config/logger';
import { ServiceError, handleServiceError } from '@/utils/errors/handle-service-error';

/**
 * Executes an async function and handles errors in a standardized way
 * @param action The async function to execute
 * @param logger Logger instance
 * @param errorMessage Optional custom error message
 * @returns The result of the async function
 * @throws ServiceError
 */
export async function executeService<T>(action: () => Promise<T>, logger: Logger, errorMessage?: string): Promise<T> {
    try {
        return await action();
    } catch (error) {
        const serviceError: ServiceError = handleServiceError({
            error,
            logger,
            message: errorMessage,
        });

        throw serviceError;
    }
}

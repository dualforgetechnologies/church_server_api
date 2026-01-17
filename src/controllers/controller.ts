import Logger from '@/config/logger';
import { AppResponse } from '@/types/types';
import { handleControllerError } from '@/utils/errors/handle-controller-error';
import { ResponseHandler } from '@/utils/helpers/response.handler';
import { Response } from 'express';

export abstract class Controller {
    protected response(res: Response, options: AppResponse): object {
        const response = new ResponseHandler(res);
        return response.success(options);
    }

    protected error(params: {
        res: Response;
        error?: unknown;
        logger: Logger;
        message?: string;
    }): object {
        const response = new ResponseHandler(params.res);

        return handleControllerError({
            error: params.error as unknown as Record<string, string>,
            response,
            logger: params.logger,
            message: params.message,
        });
    }
}

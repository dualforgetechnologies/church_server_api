import { Response } from 'express';
import 'dotenv/config';
import { AppResponse } from '@/types/types';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import { AppConfig } from '@/config/app-config';

export class ResponseHandler {
    private readonly environment: string;
    private readonly response: Response;

    constructor(res: Response) {
        this.environment = AppConfig.app.env ?? 'undefined';
        this.response = res;
    }

    success(options: AppResponse): object {
        const { message, data, code = StatusCodes.OK, pagination } = options;
        const response = {
            environment: this.environment,
            status: 'success',
            message,
            data,
            type: getReasonPhrase(code),
            ...(pagination ? { pagination } : {}),
        };

        return this.response.status(code).json(response);
    }

    error(options: AppResponse): object {
        const { message, code = StatusCodes.INTERNAL_SERVER_ERROR, data, pagination } = options;
        const response: AppResponse = {
            environment: this.environment,
            message,
            ...(data ? { data } : {}),
            ...(pagination ? { pagination } : {}),
            success: false,
            code,
        };

        return this.response.status(code).json(response);
    }
}

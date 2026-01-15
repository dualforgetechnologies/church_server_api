import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

export interface TypedRequestBody<T> extends Request {
    body: T;
    idempotencyKey?: string;
    idempotencyCacheKey?: string;
}

export interface PaginatedMetaData {
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface HttpError extends Error {
    status?: number;
}

export interface TypedRequest<BodyType = unknown, QueryType = ParsedQs>
    extends Request<ParamsDictionary, unknown, BodyType, QueryType> {
    idempotencyKey?: string;
    idempotencyCacheKey?: string;
}

export interface KnownError extends Error {
    status?: number;
    data?: unknown;
    message: string;
}

export interface AppResponse<T = unknown> {
    message: string;
    code: number;
    data?: T;
    success: boolean;
    pagination?: PaginatedMetaData;
    environment?: string;
}

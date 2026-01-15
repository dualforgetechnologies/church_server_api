import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError, auth } from 'express-oauth2-jwt-bearer';
import jwt, { GetPublicKeyOrSecret } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import 'dotenv/config';
import Logger from '@/config/logger';
import { db } from '@/db/db';
import {
    AccountType,
    JwtPayload,
    JwtPayloadT,
    ResetPasswordJwtPayload,
    VerifyAccountJwtPayload,
} from '@/types/account';
import { ResponseHandler } from '@/utils/helpers';
import { JwtService } from '@/utils/jwtService';
import { User } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

const { AUTH0_DOMAIN, APP_AUTH0_AUDIENCE, JWT_ACCESS_SECRET } = process.env;

export interface AuthProfile {
    id: string;
    email: string;
    name: string;
    picture: string;
    firstName?: string;
    lastName?: string;
}

declare global {
    namespace Express {
        interface Request {
            profile: AuthProfile;
            user: User;
            accountType: AccountType;
        }
    }
}

export class AuthJwt {
    private readonly db = db;
    private readonly logger = new Logger('Auth_Middleware');
    private jwtService: JwtService;

    constructor() {
        if (!AUTH0_DOMAIN || !APP_AUTH0_AUDIENCE || !JWT_ACCESS_SECRET) {
            throw new Error('Missing environment variables for authentication.');
        }
        this.jwtService = new JwtService();
    }

    // Middleware for verifying Auth0-issued access tokens
    private verifyAuth0AccessToken = auth({
        audience: APP_AUTH0_AUDIENCE,
        issuerBaseURL: AUTH0_DOMAIN,
        tokenSigningAlg: 'RS256',
    });

    // JWKS client to fetch Auth0 public keys
    private jwks = jwksClient({
        jwksUri: `${AUTH0_DOMAIN}/.well-known/jwks.json`,
    });

    // Retrieves public signing key using 'kid' in token header
    private getSigningKey: GetPublicKeyOrSecret = (header, callback) => {
        this.jwks.getSigningKey(header.kid, (err, key) => {
            if (err) {
                this.logger.error(`Error retrieving signing key: ${err.message}`);
                return callback(err, undefined);
            }
            callback(null, key?.getPublicKey());
        });
    };

    private encodeUser = (decoded: jwt.JwtPayload): AuthProfile => {
        return {
            id: decoded.sub as string,
            email: decoded.email as string,
            name: decoded.name as string,
            picture: decoded.picture as string,
            firstName: decoded.firstname,
            lastName: decoded.lastname,
        };
    };

    // Verifies ID token from `x-auth0-id-token` header
    private verifyIdToken = async (req: Request): Promise<void> => {
        const idToken = req.headers['x-auth0-id-token'] as string;
        if (!idToken) {
            throw new UnauthorizedError('Missing ID token');
        }

        return new Promise((resolve, reject) => {
            jwt.verify(
                idToken,
                this.getSigningKey,
                {
                    algorithms: ['RS256'],
                    issuer: `${AUTH0_DOMAIN}/`,
                },
                async (err, decoded) => {
                    if (err || !decoded || typeof decoded !== 'object') {
                        this.logger.error(`ID token verification failed: ${err?.message}`);
                        return reject(new UnauthorizedError('Invalid ID token'));
                    }

                    const profile = this.encodeUser(decoded as JwtPayload);
                    req.profile = profile;
                    resolve();
                },
            );
        });
    };

    // Verifies custom-signed JWT token :: Internal service token
    private verifyCustomToken = (token: string): JwtPayloadT => {
        try {
            const decoded = this.jwtService.verifyAccessToken(token);
            if (typeof decoded !== 'object') {
                throw new Error('Token payload is not an object');
            }
            if (
                (decoded as VerifyAccountJwtPayload).isNew === true ||
                (decoded as ResetPasswordJwtPayload).hasForgotPass === true
            ) {
                throw new Error('Access restricted. Invalid access token payload');
            }
            return decoded;
        } catch (err) {
            this.logger.error(`Custom token invalid: ${(err as Error).message}`);
            throw new UnauthorizedError('Invalid custom token');
        }
    };

    private attachAccountToRequest = async (email: string, request: Request, accountType: AccountType) => {
        try {
            if (accountType === 'USER') {
                const account = await this.db.user.findFirst({ where: { email } });
                if (account) {
                    request.user = account;
                }
                return;
            }
        } catch (err) {
            this.logger.error(`Database error fetching account: ${(err as Error).message}`);
            return null;
        }
    };

    public authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const response = new ResponseHandler(res);
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

        if (!token) {
            response.error({
                message: 'Access denied:Missing Bearer token',
                code: StatusCodes.UNAUTHORIZED,
                data: undefined,
                success: false,
            });
            return;
        }

        try {
            // Attempt to verify custom token
            const { type, ...decoded } = this.verifyCustomToken(token) as JwtPayload;

            const profile = this.encodeUser(decoded);
            await this.attachAccountToRequest(profile.email, req, type);
            return next();
        } catch (customTokenError) {
            this.logger.error('Custom token verification failed, falling back to Auth0');

            // Fallback to Auth0 token verification
            this.verifyAuth0AccessToken(req, res, async () => {
                try {
                    await this.verifyIdToken(req);
                    return next();
                } catch (idTokenError) {
                    this.logger.error(`ID token fallback failed: ${(idTokenError as Error).message}`);

                    response.error({
                        message: 'Access denied: authentication token is missing or invalid.',
                        code: StatusCodes.UNAUTHORIZED,
                        success: false,
                    });
                    return;
                }
            });
        }
    };

    public authenticateSafe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const response = new ResponseHandler(res);
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
        if (!token) {
            return next();
        }
        try {
            // Attempt to verify custom token
            const { type, ...decoded } = this.verifyCustomToken(token) as JwtPayload;

            const profile = this.encodeUser(decoded);
            await this.attachAccountToRequest(profile.email, req, type);
            return next();
        } catch (customTokenError) {
            this.logger.error('Custom token verification failed, falling back to Auth0');

            // Fallback to Auth0 token verification
            this.verifyAuth0AccessToken(req, res, async () => {
                try {
                    await this.verifyIdToken(req);
                    return next();
                } catch (idTokenError) {
                    this.logger.error(`ID token fallback failed: ${(idTokenError as Error).message}`);

                    response.error({
                        message: 'Access denied: authentication token is missing or invalid.',
                        code: StatusCodes.UNAUTHORIZED,
                        success: false,
                    });
                    return;
                }
            });
        }
    };
}

export const authJWT = new AuthJwt();

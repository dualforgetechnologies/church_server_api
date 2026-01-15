import crypto from 'node:crypto';
import { AccountType, JwtPayloadT } from '@/types/account';
import { User } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { addDays } from 'date-fns';
import jwt, { SignOptions } from 'jsonwebtoken';
import { StringValue } from 'ms';
const db = new PrismaClient();

export class JwtService {
    private accessTokenSecret: string;
    private accessTokenExpiry: string;
    private refreshTokenExpiryDays: number;

    constructor() {
        const defaultAccessSecret = 'access-secret';
        const defaultAccessExpiry = '15m';
        const defaultRefreshDays = 7;

        const accessSecret = process.env.JWT_ACCESS_SECRET || defaultAccessSecret;
        const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || defaultAccessExpiry;
        const refreshExpiresInDays = process.env.JWT_REFRESH_EXPIRES_DAYS || defaultRefreshDays.toString();

        const tokenExpiryFormat = /^\d+(s|m|h|d)$/;
        if (process.env.JWT_ACCESS_EXPIRES_IN && !tokenExpiryFormat.test(accessExpiresIn)) {
            throw new Error(
                `Invalid JWT_ACCESS_EXPIRES_IN: "${accessExpiresIn}". Expected format like "15m", "1h", "7d".`,
            );
        }

        const refreshDays = Number.parseInt(refreshExpiresInDays, 10);
        if (Number.isNaN(refreshDays) || refreshDays <= 0) {
            throw new Error(`Invalid JWT_REFRESH_EXPIRES_DAYS: "${refreshExpiresInDays}". Must be a positive integer.`);
        }

        this.accessTokenSecret = accessSecret;
        this.accessTokenExpiry = accessExpiresIn;
        this.refreshTokenExpiryDays = refreshDays;
    }

    generateAccessToken(payload: JwtPayloadT, lifeSpan?: StringValue): string {
        const signOptions: SignOptions = {
            expiresIn: (lifeSpan ?? this.accessTokenExpiry) as StringValue,
        };

        return jwt.sign(payload, this.accessTokenSecret, signOptions);
    }

    verifyAccessToken(token: string): JwtPayloadT {
        try {
            return jwt.verify(token, this.accessTokenSecret) as JwtPayloadT;
        } catch {
            throw new Error('Invalid or expired access token');
        }
    }

    async generateRefreshToken(userId: string, accountType: AccountType): Promise<string> {
        const token = crypto.randomBytes(40).toString('hex');
        const expiresAt = addDays(new Date(), this.refreshTokenExpiryDays);

        if (accountType === 'USER') {
            await db.refreshToken.create({
                data: {
                    token,
                    userId,
                    expiresAt,
                },
            });
            return token;
        }

        return '';
    }

    async verifyRefreshToken(token: string): Promise<User> {
        const found = await db.refreshToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!found) {
            throw new Error('Invalid or expired refresh token');
        }

        return found.user;
    }

    async revokeRefreshToken(token: string): Promise<void> {
        try {
        } catch (error) {}
    }

    async rotateRefreshToken(token: string, accountType: AccountType): Promise<string> {
        const existing = await db.refreshToken.findUnique({ where: { token } });

        if (!existing) {
            throw new Error('Refresh token is invalid or already revoked');
        }

        await this.revokeRefreshToken(token);
        return await this.generateRefreshToken(existing.userId, accountType);
    }
}

export const jwtService = new JwtService();

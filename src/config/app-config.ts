import dotenv from 'dotenv';
dotenv.config();

/**
 * Get an environment variable or fallback, or throw if missing.
 */
function getEnv(key: string, fallback?: string): string {
    const value = process.env[key];
    if (value !== undefined && value !== '') {
        return value;
    }
    if (fallback !== undefined) {
        return fallback;
    }
    throw new Error(`Missing required environment variable: ${key}`);
}

export const AppConfig = {
    app: {
        name: getEnv('APP_NAME', 'app_Api_Service'),
        env: getEnv('APP_NODE_ENV', 'development'),
        port: Number.parseInt(getEnv('PORT', '3000'), 10),
        isProduction: getEnv('APP_NODE_ENV', 'development') === 'production',
        hostIp: getEnv('HOST_IP', ''),
        analyserSynIntervalMs: getEnv('ANALYSER_SYN_INTERVAL_MS', '10000'),
        seed: Number.parseInt(getEnv('INIT_SEED', '0'), 10),
    },

    database: {
        url: getEnv('DATABASE_URL'),
    },

    jwt: {
        accessSecret: getEnv('JWT_ACCESS_SECRET'),
        accessExpiresIn: getEnv('JWT_ACCESS_EXPIRES_IN'),
        refreshExpiresInDays: Number.parseInt(getEnv('JWT_REFRESH_EXPIRES_DAYS', '7'), 10),
        resetLinkExpiresIn: getEnv('RESET_PASSWORD_LINK_EXPIRES_IN', '5m'),
        verifyAccountExpiresIn: getEnv('VERIFY_ACCOUNT_LINK_EXPIRES_IN', '24hrs'),
    },

    auth0: {
        domain: getEnv('AUTH0_DOMAIN'),
        audience: getEnv('APP_AUTH0_AUDIENCE'),
    },

    redis: {
        enabled: getEnv('ENABLE_REDIS', 'false').toLowerCase() === 'true',
        host: getEnv('APP_REDIS_HOST', 'localhost'),
        port: Number.parseInt(getEnv('APP_REDIS_PORT', '6379'), 10),
    },
    transport: {
        smtp: {
            host: getEnv('SMTP_HOST'),
            port: Number.parseInt(getEnv('SMTP_PORT', '587'), 10),
            user: getEnv('SMTP_USER'),
            pass: getEnv('SMTP_PASS'),
            hostDescription: getEnv('SMTP_HOST_DESCRIPTION', 'app Support'),
        },
        pushNotification: {
            // VAPID_PUBLIC_KEY: getEnv('VAPID_PUBLIC_KEY', ''),
            // VAPID_PRIVATE_KEY: getEnv('VAPID_PRIVATE_KEY', ''),
        },
    },

    client: {
        baseUrl: getEnv('CLIENT_WEB_APP_URL'),
        activationUrl: `${getEnv('CLIENT_WEB_APP_URL')}${getEnv('ACCOUNT_ACTIVITION_URL_PATH')}`,
        resetPasswordUrl: `${getEnv('CLIENT_WEB_APP_URL')}${getEnv('RESET_ACCOUNT_PASSWORD_PATH')}`,
        loginUrl: `${getEnv('CLIENT_WEB_APP_URL')}${getEnv('LOGIN_PATH')}`,
    },
    secret: {
        superAdminSecret: getEnv('SUPER_ADMIN_SECRET'),
    },
    api: {
        invoicePdfUrl: (id: string) => `${getEnv('API_V1_URL')}/${getEnv('ERP_INVOICES_PATH')}/${id}/pdf`,
    },
} as const;

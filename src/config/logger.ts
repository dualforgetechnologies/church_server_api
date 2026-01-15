import winston from 'winston';

import 'dotenv/config';

const { APP_PAPERTRAIL_HOST, APP_PAPERTRAIL_PORT, APP_NAME } = process.env;

const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.colorize({ all: true }),
    winston.format.printf(({ timestamp, level, message, stack, module, context, ...meta }) => {
        const fields: string[] = [];
        if (module) {
            fields.push(`module=${JSON.stringify(module)}`);
        }
        if (context && context !== undefined) {
            fields.push(`context=${JSON.stringify(context)}`);
        }
        const metaInfo = Object.entries(meta)
            .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
            .join(' | ');

        if (metaInfo) {
            fields.push(metaInfo);
        }

        const metaSection = fields.length ? ` | ${fields.join(' | ')}` : '';
        return `${timestamp}${metaSection} | ${level}: ${stack || message}`;
    }),
);

const transports: winston.transport[] = [new winston.transports.Console()];

const logger = winston.createLogger({
    level: 'info',
    format: logFormat,
    transports,
    exitOnError: false,
});

function formatLogMessage(input: unknown): string {
    if (typeof input === 'string') {
        return input;
    }
    if (input instanceof Error) {
        return input.stack || input.message;
    }
    try {
        return JSON.stringify(input);
    } catch {
        return String(input);
    }
}

export default class Logger {
    constructor(
        private readonly defaultContext: string,
        private readonly moduleName?: string,
    ) {}

    public static log(message: unknown, context?: string): void {
        logger.info(formatLogMessage(message), { context });
    }

    public static error(err: unknown): void {
        logger.error(formatLogMessage(err));
    }

    public log(message: unknown, context?: string): void {
        logger.info(formatLogMessage(message), {
            context: context ?? this.defaultContext,
            module: this.moduleName,
        });
    }

    public error(message: string, err: unknown = null): void {
        logger.error(formatLogMessage(err ?? message), {
            message,
            context: this.defaultContext,
            module: this.moduleName,
        });
    }
}

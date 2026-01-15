import Logger from '@/config/logger';
import { db } from '@/db/db';
import { Prisma, PrismaClient } from '@prisma/client';

export class WatchService {
    protected db: PrismaClient = db;
    private printer: Logger = new Logger('DB_WATCH_SERVICE', 'APP');
    private init = false;

    watch = async (
        model: Prisma.ModelName,
        action: Prisma.PrismaAction[],
        callback: (id?: string) => Promise<void> | void,
    ) => {
        if (this.init) {
            return;
        }
        this.init = true;
        try {
            this.db.$use(async (params, next) => {
                const result = await next(params);
                if (params.model === model && action.includes(params.action)) {
                    if (Array.isArray(result)) {
                        for (const item of result) {
                            if (item?.id) {
                                callback(item.id);
                            }
                        }
                    } else {
                        if (result?.id) {
                            callback(result.id);
                        }
                    }
                }

                return result;
            });
        } catch (error) {
            this.printer.error('Failed to start WatchService middleware:', error);
        }
    };
}

export default WatchService;

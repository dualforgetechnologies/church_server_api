import type { Server as HTTPServer } from 'node:http';

class ApplicationService {
    start = async (server: HTTPServer) => {
        this.registerShutdownHandlers();

        // try {

        // } catch (error) {
        //     console.error('Error starting services:', error);
        // }
    };

    private registerShutdownHandlers() {
        process.on('SIGINT', async () => {
            await this.shutdown();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            await this.shutdown();
            process.exit(0);
        });
    }

    shutdown = async () => {
        // try {
        // } catch (error) {
        //     console.error('Error during shutdown:', error);
        // }
    };
}

export const appServices = new ApplicationService();

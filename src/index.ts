import http from 'node:http';
import express from 'express';
import fileUpload from 'express-fileupload';
import helmet from 'helmet';
import Logger from './config/logger';
import { ROUTE_BASE, Router } from './routes';
import { appServices } from './service/app.service';

import swaggerDocs from './utils/swagger/swagger';
import { AppConfig } from './config/app-config';
import { startSeed } from './seeding';

require('dotenv').config();

const PORT = process.env.PORT || 8000;

const cors = require('cors');
const app = express();

const logger = new Logger(app.name);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
    fileUpload({
        limits: { fileSize: 52428800 },
    }),
);

app.use(helmet());
app.disable('x-powered-by');

const { CORS_ORIGIN } = process.env;

app.use(
    cors({
        origin: CORS_ORIGIN || '*',
        credentials: true,
    }),
);

swaggerDocs(app);

app.use(ROUTE_BASE.V1_PATH, Router);

// Create a single HTTP server
const server = http.createServer(app);

// INIT APP SERVICES
appServices.start(server);

server.listen(PORT, () => {
    logger.log(`Server running at http://localhost:${PORT}`);
});


if(AppConfig.app.seed==1){
    startSeed()
}

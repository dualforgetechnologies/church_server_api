import path from 'node:path';
import { Application, Request, Response } from 'express';
import express from 'express';
import swaggerJsDoc, { Options } from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { version } from '../../../package.json';
import Logger from '../../config/logger';
const logger = new Logger('SWAGGER');

const options: Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Ghana firearms platform api specification',
            version,
        },
        components: {
            securitySchemes: {
                apiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'Authorization',
                },
            },
        },
        security: [{ apiKeyAuth: [] }],
    },
    apis: [path.join(process.cwd(), 'doc-specification/**/*.yml')],
};

const swaggerSpec = swaggerJsDoc(options);

function swaggerDocs(app: Application): void {
    app.use('/static', express.static(path.join(__dirname, '../../artifacts')));

    app.use(
        '/docs',
        swaggerUi.serve,
        swaggerUi.setup(swaggerSpec, {
            customSiteTitle: `app API Service Documentation - version ${version}`,
            customfavIcon: '/static/assets/favicon.ico',
        }),
    );
    app.get('/docs.json', (req: Request, res: Response) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    logger.log('Docs ready at /docs');
}

export default swaggerDocs;

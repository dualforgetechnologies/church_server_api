import type winston from 'winston';

declare global {
    var logger: winston.Logger;
}

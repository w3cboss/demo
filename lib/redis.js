'use strict';

const redisClient = require('../service/redis');
const config = global.config;
const logger = global.logger;

const redis = redisClient(config.redisUrl, 
  () => logger.info(`redis connect success,${config,redisUrl}`),
  err => logger.error(`redis connect error,${config.redisUrl},${err.message}`)
);


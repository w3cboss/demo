'use strict';

const redisClient = require('../service/redis');
const config = global.config;
const logger = global.logger;

const uri = config.redisUri || 'redis://localhost:6379';
const redis = redisClient(uri);

await redis.connectSucceed()
  .then(() => logger.info(`redis connect succeed,${uri}`))
  .catch(err => logger.error(`redis connect error!${uri},${err.message}`));

module.exports = redis;
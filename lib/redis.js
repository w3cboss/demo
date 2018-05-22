'use strict';

const createClient = require('../service/redis');
const config = global.config;
const logger = global.logger;

const uri = config.redisUri || 'redis://localhost:6379';
const redis = createClient(uri);

redis.connectSucceed = redis.connectSucceed
  .then(() => logger.debug(`redis connect succeed,${uri}`))
  .catch(err => { 
    logger.error(`redis connect error! ${err.message}`);
    throw err;
  });

module.exports = redis;
'use strict';

const createClient = require('../service/redis');
const config = global.config;
const logger = global.logger;

const uri = config.redisUri || 'redis://localhost:6379';
const redis = createClient(uri);

(async function () {
  await redis.connectSucceed
    .then(() => logger.info(`redis connect succeed,${uri}`))
    .catch(err => logger.error(`redis connect error! ${err.message}`));
})();

module.exports = redis;
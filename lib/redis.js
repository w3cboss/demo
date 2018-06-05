'use strict';

const createClient = require('../service/redis');
const config = global.config;
const logger = global.logger;

if (!config.redisUri)
  throw new Error('缺少redis配置');

const uri = config.redisUri || 'redis://localhost:6379';
const redis = createClient(uri, { keyPrefix: config.redisKey });

redis.connectSucceed = redis.connectSucceed
  .then(() => logger.trace(`redis connected, ${uri}`))
  .catch(err => { 
    logger.error(`error occur while connecting redis! ${err.message}`);
    throw err;
  });

module.exports = redis;
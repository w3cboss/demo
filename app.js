'use strict';

const config = global.config = require('./lib/config');
const logger = global.logger = require('./lib/logger');
const redis = require('./lib/redis');
const mysql = require('./lib/mysql');
const app = require('./http');

//初始化服务
async function init() {
  await Promise.all([redis.connectSucceed, mysql.connectSucceed, app.init])
    .then(() => logger.trace('all services load successfully!'))
    .catch(err => {
      logger.error(`error occur while loading service! ${err}`);
      process.exit(1);
    });
}

init();
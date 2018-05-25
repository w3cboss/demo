'use strict';

const Sequelize = require('sequelize');

function createInstance(uri, options) {
  // options.logging = msg => logger.debug(msg);
  const sequelize = new Sequelize(uri, options);
  sequelize.connectSucceed = sequelize.authenticate();  //测试连接
  return sequelize;
}

module.exports = createInstance;
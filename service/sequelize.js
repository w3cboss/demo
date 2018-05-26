'use strict';

const Sequelize = require('sequelize');
const cls = require('continuation-local-storage');

const namespace = cls.createNamespace('default');
Sequelize.useCLS(namespace);

function createInstance(uri, options) {
  // options.logging = msg => logger.debug(msg);
  const sequelize = new Sequelize(uri, options);
  sequelize.connectSucceed = sequelize.authenticate();  //测试连接
  return sequelize;
}

module.exports = createInstance;
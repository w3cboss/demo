'use strict';

const Sequelize = require('sequelize');
const cls = require('continuation-local-storage');

const namespace = cls.createNamespace('default');
Sequelize.useCLS(namespace);  //自动传递transaction对象

function createInstance(uri, options) {
  const sequelize = new Sequelize(uri, options);
  sequelize.connectSucceed = sequelize.authenticate();  //测试连接
  return sequelize;
}

module.exports = createInstance;
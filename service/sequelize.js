'use strict';

const Sequelize = require('sequelize');

function createInstance(uri, options) {
  const sequelize = new Sequelize(uri, options);

  sequelize.connectSucceed = sequelize.authenticate();  //测试连接
}

module.exports = createInstance;
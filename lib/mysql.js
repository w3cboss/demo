const fs = require('fs');
const path = require('path');
const lodash = require('lodash');
const createInstance = require('../service/sequelize');

const config = global.config;
const logger = global.logger;

if (!config.mysql)
  throw new Error('缺少mysql配置');

const modelPath = `${path.resolve(__dirname, '..')}/model`;
const paths = getFilePaths(modelPath);
const mysql = createInstance(config.mysql.uri, config.mysql.options);
paths.forEach(path => mysql.import(path));

mysql.connectSucceed = mysql.connectSucceed
  .tap(async () => {
    logger.trace(`mysql connected, ${config.mysql.uri}`);
    await mysql.sync();
  })
  .tap(() => logger.trace('mysql synced successfully.'))
  .catch(err => { 
    logger.error(`error occur while connecting mysql! ${err.message}`);
    throw err;
  });

module.exports = mysql;

/**
 * 获取目录下所有文件路径
 * @param {strubg} dirPath 目录路径
 * @return {Array}
 */
function getFilePaths(dirPath){
  const files = fs.readdirSync(dirPath);
  return lodash.flatMapDeep(files, (fileName, index) => {
    const path = `${dirPath}/${fileName}`;
    const stat = fs.statSync(path);
    if(stat.isFile()) return path;
    else return getFilePaths(path);
  });
}
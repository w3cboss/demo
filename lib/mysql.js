'use strict';

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

//建立模型关联关系
const { User, Post, Carousel, Attach, PostDept, Dept, 
  Reply, Privilege, Tip } = mysql.models;
User.hasMany(Post, { foreignKey: 'user_id' });
Post.belongsTo(User, { foreignKey: 'user_id' });
Post.hasMany(PostDept, { foreignKey: 'post_id', constraints: false});
// Dept.hasMany(PostDept, {})

// Post.hasMany(Reply, { foreignKey: 'post_id'});
Reply.belongsTo(User, { foreignKey: 'user_id' });
// Reply.hasMany(Reply, { foreignKey: 'reply_id1', as: 'reply1'});
// Reply.hasMany(Reply, { foreignKey: 'reply_id2', as: 'reply2'});
// User.hasMany(Privilege, { foreignKey: 'user_id' });

Carousel.belongsTo(Post, { foreignKey: 'post_id' })
Attach.belongsTo(User, { foreignKey: 'user_id' });
Attach.belongsTo(Post, { foreignKey: 'post_id' });

Tip.belongsTo(User, { foreignKey: 'reply_user_id' });
Tip.belongsTo(Post, { foreignKey: 'post_id' });
// Attach.belongsTo(Post, { foreignKey: 'post_id', });
// PostDept.belongsTo(Post, { foreignKey: 'post_id' });
// PostDept.belongsTo(Dept, { foreignKey: 'dept_id' });

// mysql.define("Privilege",{
//   Id: {
//     references:
//   }
// })

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
function getFilePaths(dirPath) {
  const files = fs.readdirSync(dirPath);

  return lodash.flatMapDeep(files, function (fileName, index) {
    const path = `${dirPath}/${fileName}`;
    const stat = fs.statSync(path);
    if (stat.isFile()) return path;
    else return getFilePaths(path);
  });
}
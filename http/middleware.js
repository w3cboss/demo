'use strict';

const redis = require('../lib/redis');
const { User } = require('../lib/mysql').models;

const config = global.config;
const logger = global.logger;

const checkLoginPaths = [''];

const checkAdminPaths = ['/admin/getlevels', ''];

module.exports = { checkLogin, checkIsAdmin };

/**
 * 登录中间件
 * @param {*} ctx 
 * @param {*} next 
 */
async function checkLogin(ctx, next){
  const { endfor } = ctx;
  if (!checkLoginPaths.includes(ctx.path)) {
    await next();
    return;
  };

  const token = ctx.cookies.get(config.cookieKey);
  if (!token) return endfor(10);

  const number = await redis.get(token)
    .catch(err => logger.error(`checkLogin读取redis失败,${err.message}`));
  if (!number) return endfor(10);

  const user = await User.findOne({
    where: { Number: +number, State: 0 }
  }).catch(err => logger.error(`checkLogin查询user失败,${err.message}`));

  if (!user) {
    logger.error(`checkLogin查询user不存在,${number}`);
    return endfor(40);
  }

  ctx.user = user;
  await next();
}

/**
 * 管理员接口验证中间件
 * @param {*} ctx 
 * @param {*} next 
 */
async function checkIsAdmin(ctx, next) {
  const { endfor } = ctx;
  if (!checkAdminPaths.includes(ctx.path)){
    await next();
    return;
  } 

  const token = ctx.cookies.get(config.adminCookieKey);
  if (token) return endfor(10);

  const val = await redis.get(token)
    .catch(err => logger.error(`checkIsAdmin读取redis失败,${err.message}`));
  if (!val || val !== 'admin' ) 
    return endfor(10);

  ctx.isAdmin = true;
  await next();
}
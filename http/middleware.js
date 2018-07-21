'use strict';

const redis = require('../lib/redis');
const { User, Privilege } = require('../lib/mysql').models;

const ET = require('../ET');

const config = global.config;
const logger = global.logger;

const noLoginPaths = ['/user/login',];

const privilegeMap = new Map([
  [`${Privilege.ETYPE.超级管理员}`, ['/admin/get_levellist', '/admin/add_level', '/admin/get_deptlist',
    '/admin/add_dept', '/admin/update_dept', '/admin/get_userpage', '/admin/add_user', 
    '/admin/import_users', '/admin/update_user', '/admin/get_postpage', '/admin/update_post', 
    '/admin/get_carousellist', '/admin/get_carouselinfo', '/admin/add_carousel', '/admin/update_carousel'
  ]],
  [`${Privilege.ETYPE.发布轮播图}`, ['/admin/get_carousellist', '/admin/get_carouselinfo', '/admin/add_carousel',
    '/admin/update_carousel'
  ]],
  [`${Privilege.ETYPE.管理帖子}`, ['/admin/get_postpage', '/admin/update_post']]
]);

module.exports = { checkLogin, checkPrivileg };

/**
 * 登录中间件
 * @param {*} ctx 
 * @param {*} next 
 */
async function checkLogin(ctx, next) {
  const { endfor } = ctx;
  if (noLoginPaths.includes(ctx.path)) {
    await next();
    return;
  };

  const token = ctx.cookies.get(config.cookieKey);
  if (!token) return endfor(ET.未登录);

  const number = await redis.get(`user:${token}`)
    .catch(err => logger.error(`checkLogin读取redis失败,${err.message}`));
  if (!number) return endfor(ET.未登录);

  const user = await User.findOne({
    where: { Number: +number, State: 0 }
  }).catch(err => logger.error(`checkLogin查询user失败,${err.message}`));

  if (!user) {
    logger.error(`checkLogin查询user不存在,${number}`);
    return endfor(ET.数据异常);
  }

  ctx.user = user;
  await next();

  //更新redis缓存时间
  redis.expire(token, 7 * 24 * 3600)
    .catch(err => logger.error(`checkLogin更新redis缓存时间失败,${err.message}`));
}

/**
 * 权限接口验证中间件
 * @param {*} ctx 
 * @param {*} next 
 */
async function checkPrivileg(ctx, next) {
  const { endfor, user } = ctx;

  const privileges = await Privilege.findAll({
    where: { UserId: user.Id }
  }).then(rows => rows.map(row => row.Type))
    .catch(err => logger.error(`checkPrivileg查询失败`));

  if (!privileges) return endfor(ET.数据异常);

  for (const [type, paths] of privilegeMap) {
    if (paths.includes(ctx.path) && !privileges.includes(type))
      return endfor(ET.没有权限);
  }

  await next();
}
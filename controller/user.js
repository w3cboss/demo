'use strict';

const Sequelize = require('sequelize');
const lodash = require('lodash');
const UUID = require('uuid');

const mysql = require('../lib/mysql');
const tools = require('../lib/tools')
const redis = require('../lib/redis');

const { User } = mysql.models;
const logger = global.logger;
const { cookieKey } = global.config;

module.exports = { getLevels, addLevel };

/**
 * 登录接口
 * @param {string} params.number 工号
 * @param {string} params.passmd5 初始密码的md5值
 */
async function login(ctx) {
  const { params, endfor } = ctx;
  const { number, passmd5 } = params;
  if (!number || !passmd5 || passmd5.length != 32)
    return endfor(20);

  const pass = tools.md5(passmd5);  //原文进行两次md5得到密文
  const user = await User.find({
    where: { Number: number, State: 0 }
  }).catch(err => logger.error(`login查询user1失败,${err.message}`));

  if (!user) return endfor(25);
  if (user.Pass != pass) return endfor(31);

  const token = UUID.v4().replace(/\W/g, '');
  const succ = redis.set(token, number, 'EX', 7 * 24 * 3600)
    .then(() =>  true)
    .catch(err => logger.error(`login setredis失败,${err.message}`));

  if (succ) ctx.cookies.set(cookieKey, token);
  return endfor(succ ? 0 : 40);
}

const Sequelize = require('sequelize');
const lodash = require('lodash');
const UUID = require('uuid');

const mysql = require('../lib/mysql');
const tools = require('../lib/tools')
const redis = require('../lib/redis');

const { User } = mysql.models;
const logger = global.logger;
const { cookieKey } = global.config;

module.exports = { login, setPassword };

/**
 * 登录接口
 * @param {string} params.number 工号
 * @param {string} params.passmd5 初始密码的md5值
 */
async function login(ctx) {
  const { params, endfor } = ctx;
  const { number, passmd5 } = params;
  if (!number || !passmd5 || passmd5.length != 32)
    return endfor(20);

  const pass = tools.md5(passmd5);  //原文进行两次md5得到密文
  const user = await User.find({
    where: { Number: number, State: 0 }
  }).catch(err => logger.error(`login查询user1失败,${err.message}`));

  if (!user) return endfor(25);
  if (user.Pass != pass) return endfor(31);

  const token = UUID.v4().replace(/\W/g, '');
  const succ = redis.set(token, number, 'EX', 7 * 24 * 3600)
    .then(() =>  true)
    .catch(err => logger.error(`login setredis失败,${err.message}`));

  if (succ) ctx.cookies.set(cookieKey, token);
  return endfor(succ ? 0 : 40);
}

/**
 * 修改密码
 * @param {*} param0 
 */
async function setPassword({ params, endfor }) {
  const { pass, newpass } = params;
  if (!(pass && newpass)) return endfor(20);
  if (newpass.length < 6) return endfor(23);
  if (ctx.user.pass != pass) return endfor(27);

  const user = await ctx.user.update({ Pass: newpass })
    .catch(error => logger.error(`setPassword更新user失败,${err.message}`));
  if (!user) return endfor(40);

  return endfor(0);
}


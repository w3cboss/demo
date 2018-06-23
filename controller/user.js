'use strict';

const UUID = require('uuid');
const fs = require('fs');

const mysql = require('../lib/mysql');
const tools = require('../lib/tools')
const redis = require('../lib/redis');

const ET = require('../ET');

const { User, Dept, Privilege, Tip } = mysql.models;
const logger = global.logger;
const config = global.config;

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

/**
 * 修改密码
 * @param {*} param0 
 */
async function setPassword({ params, user, endfor }) {
  const { pass, newpass } = params;
  if (!(pass && newpass)) return endfor(ET.缺少必须参数);
  if (newpass.length < 6) return endfor(ET.参数不合法);
  if (user.pass != pass) return endfor(ET.密码不正确);

  const newUser = await user.update({ Pass: newpass })
    .catch(err => logger.error(`user.setPassword更新user失败,${err.message}`));
  if (!newUser) return endfor(ET.数据异常);

  return endfor(ET.成功);
}

/**
 * 上传图片
 * @param {*} ctx 
 */
async function uploadImg(ctx) {
  const { user, endfor } = ctx;

  const date = new Date();
  const filePath = `${config.imgPath}/${date.getFullYear}${date.getMonth}`;
  if (!fs.existsSync(filePath))
    fs.mkdirSync(filePath);

  const filePaths = await tools.busboy(ctx, filePath, 'img', config.imgOptions);
  if (!filePaths || filePaths.length === 0) 
    return endfor(ET.文件上传失败);

  return endfor(ET.成功, { url: '虚拟目录' });
}

/**
 * 修改头像
 * @param {*} param0 
 */
async function setAvater({ params, user, endfor }) {
  const { avater } =  params;
  if (!avater) return endfor(ET.缺少必须参数);
  if (avater.length > 128) return endfor(ET.参数不合法);

  const newUser = await user.update({ Avater: avater })
    .catch(err => logger.error(`user.setAvater更新user失败,${err.message}`));
  if (!newUser) return endfor(ET.数据异常);

  return endfor(ET.成功);
}

/**
 * 获取当前用户信息
 * @param {} param0 
 */
async function getInfo({ user, endfor }) {
  const dept = await Dept.findById(user.DeptId)
    .catch(err => logger.error(`user.getInfo查询dept失败,${err.message}`));
  if (!dept) return endfor(ET.数据异常);

  const privileges = await Privilege.findAll({
    where: { UserId: user.id }
  }).catch(err => logger.error(`user.getInfo查询privilege失败,${err.message}`));
  if (!privileges) return endfor(ET.数据异常);

  let tipCount = await Tip.count({
    where: {
      UserId: user.id,
      State: 0
    }
  }).catch(err => logger.error(`user.getInfo查询tip失败,${err.message}`));
  if (tipCount === undefined) return endfor(ET.数据异常);

  return endfor(ET.成功, {
    name: user.Name, number: user.Number, avater: user.Avater,
    dept: dept.Name, isAdmmin: user.IsAdmin, state: user.State,
    privilege: privileges.map(p => p.Type), tipCount
  });
}
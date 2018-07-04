'use strict';

const UUID = require('uuid');
const fs = require('fs');

const mysql = require('../lib/mysql');
const tools = require('../lib/tools')
const redis = require('../lib/redis');

const ET = require('../ET');
const { checkpara_int, checkpara_str } = tools;

const { User, Dept, Privilege, Tip } = mysql.models;
const logger = global.logger;
const config = global.config;

module.exports = { login, changePass, uploadImg, setAvater, getInfo };

/**
 * 登录接口
 * @param {string} params.number 工号
 * @param {string} params.pass 保存密码
 */
async function login(ctx) {
  const { params, endfor } = ctx;
  const { number, pass } = params;
  if (!(number && pass)) return endfor(ET.缺少必须参数);
  if (!checkpara_str(number, 1, 16) || !checkpara_str(pass, 32, 32))
    return endfor(ET.参数不合法);

  const user = await User.find({
    attributes: ['Number', 'Pass'],
    where: { Number: number, State: 0 }
  }).catch(err => logger.error(`login查询user1失败,${err.message}`));

  if (!user) return endfor(ET.记录不存在);
  if (user.Pass != pass) return endfor(ET.密码不正确);

  const token = UUID.v4().replace(/\W/g, '');
  const succ = await redis.set(`user:${token}`, number, 'EX', 7 * 24 * 3600)
    .then(() =>  true)
    .catch(err => logger.error(`login setredis失败,${err.message}`));

  if (succ) ctx.cookies.set(config.cookieKey, token);
  return endfor(succ ? ET.成功 : ET.失败);
}

/**
 * 修改密码
 * @param {*} param0 
 */
async function changePass({ params, user, endfor }) {
  const { pass, newpass } = params;
  if (!(pass && newpass)) return endfor(ET.缺少必须参数);
  if (!checkpara_str(pass, 32, 32) || !checkpara_str(newpass, 32, 32)) 
    return endfor(ET.参数不合法);
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
  let month = date.getMonth().toString();
  if (month.length < 2) month = `0${month}`;
  const path = `${date.getFullYear()}${month}/${user.Number}`;
  const dirPath = `${config.imgPath}/${path}`;
  tools.mkMultiDir(dirPath);

  const imgOptions = config.imgOptions;
  if (!imgOptions) throw new Error('缺少必要配置:imgOptinos!');

  const { fileSize, files, rename, allowExts } = imgOptions;
  const options = {
    limits: {
      fileSize: fileSize || 1024 * 1024 * 3,
      files: files || 1,
    },
    allowExts,
    rename,
  }
  const fileArr = await tools.saveFile(ctx, dirPath, 'img', options)
    .catch(err => logger.error(`user.uploadImg上传文件失败,${err.message}`));
  if (!fileArr || fileArr.length === 0) 
    return endfor(ET.文件上传失败);

  return endfor(ET.成功, { url: `/img/${path}/${fileArr[0].fileName}` });
}

/**
 * 修改头像
 * @param {*} param0 
 */
async function setAvater({ params, user, endfor }) {
  const { url } =  params;
  if (!url) return endfor(ET.缺少必须参数);
  if (!checkpara_str(url, 10, 128)) return endfor(ET.参数不合法);

  const regex = /^\/img\/\d{6}\/\d+\/\w+\.\w+$/;
  if (!regex.test(url)) return endfor(ET.参数不合法);

  const newUser = await user.update({ Avater: url })
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
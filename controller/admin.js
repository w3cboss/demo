'use strict';

const mysql = require('../lib/mysql');
const Sequelize = require('sequelize');
const lodash = require('lodash');
const fs = require('fs');
const xlsx = require('node-xlsx');
const path = require('path');

const ET = require('../ET');
const tools = require('../lib/tools');
const { checkpara_int, checkpara_str } = tools;

const { User, Level, Dept, Post, Privilege, Carousel } = mysql.models;
const logger = global.logger;
const config = global.config;

module.exports = {
  getLevelList, addLevel, updateLevel, getDeptList, addDept,
  updateDept, getUserPage, addUser, importUsers, updateUser, getPostPage, updatePost,
  getCarouselList, getCarouselInfo, addCarousel, updateCarousel
};

/**
 * 获取部门等级列表
 * @param {*} param0 
 */
async function getLevelList({ endfor }) {
  const levels = await Level.findAll({
    where: { State: 0 },
    raw: true
  }).catch(err => logger.error(`admin.getLevelList查询level失败,${err.message}`));
  if (!levels) return endfor(ET.数据异常);

  return endfor(ET.成功, { items: levels });
}

/**
 * 新增部门等级
 * @param {object} params
 * @param {string} params.name
 */
async function addLevel({ params, endfor }) {
  const { name } = params;
  if (!name) return endfor(ET.缺少必须参数);
  if (!checkpara_str(name, 1, 16)) return endfor(ET.参数不合法);

  let level = await Level.find({
    where: { Name: name },
    attributes: ['name'],
    raw: true
  }).catch(err => logger.error(`admin.addLevel查询level失败,${err.message}`));
  if (level) return endfor(ET.记录已存在);

  //所有已存在的记录rank+1
  level = await mysql.transaction(() => {
    return Level.update(
      { Rank: mysql.literal('`rank` + 1') },
      { where: { State: 0 } }
    ).then(() => {
      return Level.create({ Name: name })
    });
  }).catch(err => logger.error(`admin.addLevel新增失败,${err.message}`));

  return endfor(level ? ET.成功 : ET.数据异常);
}

/**
 * 修改部门等级
 * @param {object} params
 * @param {string} params.id 
 * @param {string} params.name
 * @param {string} params.state 0-启用 1-禁用
 * @param {string} params.type 0-上移 1-下移
 * @return {object} 
 */
async function updateLevel({ params, endfor }) {
  const { id, name, state, type } = params;
  if (!id) return endfor(ET.缺少必须参数);
  if (!checkpara_int(id)) return endfor(ET.参数不合法);
  if (!checkpara_int(type, 1, 2) || !checkpara_int(state, 0, 1) || !checkpara_str(name, 1, 16))
    return endfor(ET.参数不合法);

  let level = await Level.findById(+id)
    .catch(err => logger.error(`admin.updateLevel查询1失败，${err.message}`));
  if (!level) return endfor(ET.记录不存在);

  if (name) {
    level = await level.update(
      { Name: name }
    ).catch(err => logger.error(`admin.updateLevel更新name失败，${err.message}`));
  } else if (state) {
    level = await level.update(
      { State: state }
    ).catch(err => logger.error(`admin.updateLevel更新state失败，${err.message}`));
  } else if (type) {
    const op = {};
    if (type == 1) { //上移
      op.where = { Rank: { [Sequelize.Op.gt]: level.Rank } };
      op.order = [['Rank', 'ASC']]
    }
    else if (type == 2) {
      op.where = { Rank: { [Sequelize.Op.lt]: level.Rank } };
      op.order = [['Rank', 'DESC']]
    }

    const dstLevel = await Level.findOne(op)
      .catch(err => logger.error(`admin.updateLevel查询2失败，${err.message}`));
    if (!dstLevel) return endfor(ET.记录不存在);

    const rank = level.Rank;
    level = await mysql.transaction(() => {
      return level.update({ Rank: dstLevel.Rank })
        .then(() => dstLevel.update({ Rank: rank }));
    }).catch(err => logger.error(`admin.updateLevel更新事务失败,${err.message}`));
  }

  return endfor(level ? ET.成功 : ET.数据异常);
}


async function getDeptList({ params, endfor }) {
  const { id } = params;
  if (!id) return endfor(ET.缺少必须参数);
  if (!checkpara_int(id, 1)) return endfor(ET.参数不合法);

  const depts = await Dept.findAll({
    where: { LevelId: +id, State: 0 },
    raw: true
  }).catch(err => logger.error(`admin.getDeptList查询dept失败，${err.message}`));

  if (!depts) return endfor(ET.数据异常);
  return endfor(ET.成功, { items: depts });
}

/**
 * 新增部门
 * @param {*} params
 * @param {*} params.id 部门等级
 * @param {*} params.name 部门名称
 */
async function addDept({ params, endfor }) {
  const { levelId, name } = params;
  if (!(levelId && name)) return endfor(ET.缺少必须参数);
  if (!checkpara_int(levelId) || !checkpara_str(name, 1, 16)) return endfor(ET.参数不合法);

  const level = await Level.findById(+levelId,
    { where: { State: 0 } }
  ).catch(err => `admin.addDept查询level失败，${err.message}`);
  if (!level) return endfor(ET.记录不存在);

  let dept = await Dept.findOne({
    where: { Name: name, State: 0 }
  }).catch(err => `admin.addDept查询dept失败，${err.message}`);
  if (dept) return endfor(ET.记录已存在);

  dept = await Dept.create({
    Name: name, LevelId: +levelId
  }).catch(err => `admin.addDept查询dept失败，${err.message}`);

  return endfor(dept ? ET.成功 : ET.数据异常);
}

/**
 * 修改部门
 * @param {*} params
 * @param {*} params.id
 * @param {*} params.name
 * @param {*} params.state
 */
async function updateDept({ params, endfor }) {
  const { id, name, state } = params;
  if (!id || !(name || state)) return endfor(ET.缺少必须参数);
  if (!checkpara_int(id) || !checkpara_str(name, 1, 16) || !checkpara_int(state, 0, 1)) 
    return endfor(ET.参数不合法);

  let dept = await Dept.findOne({
    where: { Id: +id }
  }).catch(err => logger.error(`admin.updateDept查询dept1失败，${err.message}`));
  if (!dept) return endfor(ET.记录不存在);

  const value = {};
  if (name) {
    const dpt = await Dept.findOne({
      where: { Name: name }
    }).catch(err => logger.error(`admin.updateDept查询dept2失败，${err.message}`));
    if (dpt) return endfor(ET.记录已存在);
    value.Name = name;
  } else {
    value.State = +state;
  }
  dept = await dept.update(value)
    .catch(err => logger.error(`admin.updateDept更新失败，${JSON.stringify(value)},${err.message}`));
  return endfor(dept ? ET.成功 : ET.数据异常);
}

/**
 * 获取用户页
 * @param {*} param0 
 */
async function getUserPage({ params, endfor }) {
  const { deptId, key, page = 1, size = 10 } = params;
  const where = {};
  if (!checkpara_int(deptId) || !checkpara_str(key, 1))
    return endfor(ET.参数不合法); 
  if (deptId) where.DeptId = { $in: deptId.split(',') };
  if (key) where.Key = { $like: `%${key}%` };

  const result = await User.findAndCountAll({
    where,
    raw: true,
    offset: (page - 1) * size,
    limit: size
  }).catch(err => logger.error(`admin.getUsers查询users失败，${err.message}`));
  if (!result) return endfor(ET.数据异常);

  const { count, rows } = result;
  return endfor(ET.成功, { count, items: rows });
}

/**
 * 新增用户
 * @param {*} params
 * @param {*} params.number
 * @param {*} params.name
 * @param {*} params.deptid
 */
async function addUser({ params, endfor }) {
  const { number, name, deptId } = params;
  if (!(number && name && deptId))
    return endfor(ET.缺少必须参数);
  if (!checkpara_int(deptId) || !checkpara_str(name, 1, 16) || !checkpara_str(number, 1, 32)) 
    return endfor(ET.参数不合法);

  let user = await User.findOne({
    where: {
      Number: number,
      State: 0
    }
  }).catch(err => logger.error(`admin.addUser查询user失败，${err.message}`));
  if (user) return endfor(ET.记录已存在);

  const dept = await Dept.findOne({
    where: { Id: +deptId }
  }).catch(err => logger.error(`admin.addUser查询dept失败，${err.message}`));
  if (!dept) return endfor(ET.记录不存在);

  user = await User.create({
    Number: number, Name: name, DeptId: +deptId,
    Pass: tools.generatePass(number),
    Key: `${name}_${number}`, Avater: config.defaultAvater
  }).catch(err => logger.error(`admin.addUser新增失败，${err.message}`));
  return endfor(user ? ET.成功 : ET.数据异常);
}

/**
 * 批量导入用户
 * @param {*} params
 */
async function importUsers(ctx) {
  const { endfor } = ctx;

  const { excelOptions, tmpPath } = config;
  if (!fs.existsSync(tmpPath)) {
    fs.mkdirSync(tmpPath);
  }
  //尝试保存上传的附件
  const fileNames = await tools.saveFile(ctx, tmpPath, ['user'], excelOptions)
    .catch(err => logger.error(`${err.message}`));
  if (!fileNames || fileNames.length === 0)
    return endfor(ET.文件上传失败);

  const absolutePath = path.join(tmpPath, fileNames[0].fileName);
  const data = xlsx.parse(absolutePath);
  fs.unlink(absolutePath, lodash.noop);

  if (!data || data.length === 0) return endfor(ET.文件内容不正确);
  const lines = data[0].data;
  if (!lines || lines.length === 0) return endfor(ET.文件内容不正确);

  //number去重
  const numbers = lines.map(line => line[0]);
  let users = await User.findAll({
    attributes: ['Number'],
    where: {
      State: 0,
      Number: { $in: numbers }
    }
  }).catch(err => logger.error(`admin.importUser查询user失败,${err.message}`));
  if (!users) return endfor(ET.数据异常);
  if (users.length > 0) return endfor(ET.记录已存在, { items: users.map(user => user.Number) });

  const depts = await Dept.findAll({
    attributes: ['Id', 'Name'],
    where: {
      State: 0
    }
  }).catch(err => logger.error(`admin.importUser查询dept失败,${err.message}`));
  if (!depts) return endfor(ET.数据异常);

  const deptMap = new Map();
  const deptNames = new Array();
  depts.forEach(dept => {
    deptMap.set(dept.Name, dept.Id);
    deptNames.push(dept.Name);
  });

  const values = [];
  //过滤不存在的部门
  lines.forEach(line => {
    const [number, name, dept] = line;
    if (!deptNames.includes(dept)) return;
    values.push({
      Number: number, Name: name, DeptId: deptMap.get(dept),
      Pass: tools.generatePass(number.toString()),
      Key: `${name}_${number}`, Avater: config.defaultAvater
    })
  });

  users = await User.bulkCreate(values)
    .catch(err => logger.error(`admin.importUser插入失败,${err.message}`));
  if (!users) return endfor(ET.数据异常);

  return endfor(ET.成功, { count: users.length });
}

/**
 * 更新用户信息
 * @param {*} params
 */
async function updateUser({ params, endfor }) {
  const { id, pass, number, name, deptId, isAdmin, state, privilege } = params;
  if (!id || !(number || name || deptId || pass || isadmin || state))
    return endfor(ET.缺少必须参数);
  if (!checkpara_int(id) || !checkpara_str(pass, 1, 32) || !checkpara_str(number, 1, 32) ||
      !checkpara_str(name, 1, 16) || !checkpara_int(deptId) || !checkpara_int(isAdmin, 0, 1) ||
      !checkpara_int(state, 0, 1) || !checkpara_str(privilege)) 
    return endfor(ET.参数不合法);

  let types = [];
  if (privilege) {
    types = privilege.split(',');
    if (types.length > 0) {
      let valid = true;
      types.forEach(type => valid &= !isNaN(type));
      if (!valid) return endfor(ET.参数不合法);
    }
  }

  let user = await User.findById(+id, {
    where: { State: 0 }
  }).catch(err => `updateUser查询user1失败,${err.message}`);
  if (!user) return endfor(ET.记录不存在);

  const values = {};
  if (number) {
    const entity = await User.findOne({
      where: {
        Number: number,
        State: 0,
        $not: { Id: id }
      }
    }).catch(err => logger.error(`updateUser查询user2失败，${err.message}`));
    if (entity) return endfor(ET.记录已存在);
  }

  if (deptId) {
    const dept = await Dept.findById(+deptId, {
      where: { State: 0 }
    }).catch(err => logger.error(`updateUser查询dept失败，${err.message}`));
    if (!dept) return endfor(ET.记录不存在);
  }

  user = await mysql.transaction(() => {
    return Privilege.destroy({
      where: { UserId: +id }
    }).then(() => {
      return Privilege.bulkCreate(types.map(type => {
        return { UserId: +id, Type: type };
      }));
    }).then(() => {
      const values = {};
      if (number) values.Number = number;
      if (name) values.Name = name;
      if (deptId) values.DeptId = +deptId;
      if (pass) values.Pass = pass;
      if (isAdmin) values.IsAdmin = isAdmin;
      if (state) values.State = state;
      if (number || name)
        values.Key = `${name || user.Name}_${number || user.Number}`

      return user.update(values);
    })
}).catch (err => logger.error(`admin.updateUser更新失败,${err.message}`));

return endfor(user ? ET.成功 : ET.数据异常);
}

/**
 * 获取帖子列表
 * @param {*} param0 
 */
async function getPostPage({ params, endfor }) {
  const { key, page = 1, size = 20 } = params;
  if (page <= 0 || size <= 0)
    return endfor(ET.缺少必须参数);
  if (!checkpara_str(key)) return endfor(ET.参数不合法);

  const where = { State: Post.ESTATE.启用 };
  if (key) where.Title = { $like: `%${key}%` };

  const results = await Post.findAndCountAll({
    attributes: ['Id', 'Title', 'UserId', 'Count', 'State', 'CreateTime', 'IsTop'],
    where,
    raw: true,
    order: [['IsTop', 'DESC'], ['CreateTime', 'DESC']],
    limit: size,
    offset: (page - 1) * size,
  }).catch(err => logger.error(`admin.getpage查询失败,${err.message}`));

  if (!results) return endfor(ET.数据异常);
  return endfor(ET.成功, { count: results.count, items: result.rows });
}

/**
 * 修改帖子
 * @param {*} param0 
 */
async function updatePost({ params, endfor }) {
  const { id, type } = params;
  if (!(id && type))
    return endfor(ET.缺少必须参数);
  if (!checkpara_int(id) || !checkpara_int(type, 1, 3))
    return endfor(ET.参数不合法);

  let post = await Post.findById(id, {
    where: {
      State: 0
    }
  }).catch(err => logger.error(`admin.updatepost查询失败,${err.message}`));
  if (!post) return endfor(ET.记录不存在);

  const value = {};
  switch (type) {
    case 1:
      value.IsTop = 1;
      break;
    case 2:
      value.IsTop = 0;
      break;
    case 3:
      value.State = 1;
      break;
  }

  post = await post.update({
    IsTop: 1
  }).catch(err => logger.error(`admin.updatepost更新失败,${err.message}`));
  if (!post) return endfor(ET.数据异常);

  return endfor(ET.成功);
}

/**
 * 获取轮播图列表
 * @param {*} param0 
 */
async function getCarouselList({ params, endfor }) {
  const carousels = await Carousel.findAll({
    attributes: ['Id', 'Title', 'Rank', 'Url'],
    where: { State: 0 },
    order: [['Rank', 'ASC']],
    include: {
      model: Post,
      attributes: ['Id', 'Title']
    },
    raw: true
  }).catch(err => logger.error(`admin.getCarouselList查询失败,${err.message}`));
  if (!carousels) return endfor(ET.数据异常);

  return endfor(ET.成功, { items: carousels });
}

/**
 * 获取轮播图信息
 * @param {} param0 
 */
async function getCarouselInfo({ params, endfor }) {
  const { id } = params;
  if (!id) return endfor(ET.缺少必须参数);
  if (!checkpara_int(id)) return endfor(ET.参数内容不合法);

  const carousels = await Carousel.findById(id, {
    where: { State: 0 },
    include: {
      model: Post,
      attributes: ['Id', 'Title']
    }
  }).catch(err => logger.error(`admin.getCarouselInfo查询失败,${err.message}`));
  if (!carousels) return endfor(ET.记录不存在);

  return endfor(ET.成功, { items: carousels });
}

/**
 * 添加轮播图
 * @param {} param0 
 */
async function addCarousel({ params, user, endfor }) {
  const { title, url, postId } = params;
  if (!(url && postId))
    return endfor(ET.缺少必须参数);
  if (!checkpara_str(url, 1, 128) || !checkpara_str(title, 1, 64) || !checkpara_int(postId))
    return endfor(ET.参数不合法);

  const post = await Post.findById(postId, {
    where: { State: 0 }
  }).catch(err => logger.error(`admin.addCarousel查询post失败,${err.message}`));
  if (!post) return endfor(ET.记录不存在);

  //所有已存在的记录rank+1
  const carousel = await mysql.transaction(() => {
    return Carousel.update(
      { Rank: mysql.literal('`rank` + 1') },
      { where: { State: 0 } }
    ).then(() =>
      Carousel.create({
        PostId: postId, Title: title,
        UserId: user.Id, Url: url
      })
    )
  }).catch(err => logger.error(`admin.addCarousel更新失败,${err.message}`));
  if (!carousel) return endfor(ET.数据异常);

  return endfor(ET.成功);
}

/**
 * 修改轮播图
 * @param {*} param0 
 */
async function updateCarousel({ params, endfor }) {
  const { id, postId, title, type, state } = params;

  if (!id || !(postId && title && type && state))
    return endfor(ET.缺少必须参数);
  if (!checkpara_int(id) || !checkpara_int(postId) || !checkpara_int(state, 0 ,1))
    return endfor(ET.参数内容不合法);

  let carousel = await Carousel.findById(id, {
    where: { State: 0 }
  }).catch(err => logger.error(`admin.updateCarousel查询1失败，${err.message}`));
  if (!carousel) return endfor(ET.记录不存在);

  let count = 0;
  const update = {};
  if (title) update.Title = title;
  if (state) update.State = state;
  if (postId) {
    const post = Post.findById(postId, {
      where: { State: 0 }
    }).catch(err => `admin.updateCarousel查询post失败,${err.message}`);
    if (!post) return endfor(ET.记录不存在);

    update.PostId = postId;
  }

  if (lodash.keys(update).length > 0) {
    carousel = carousel.update(update)
      .catch(err => logger.error(`admin.uupdateCarousel更新1失败,${err.message}`));
    if (!carousel) return endfor(ET.数据异常);
  }

  if (type) {
    const op = {
      where: { State: 0 }
    };
    if (type === 0) { //上移
      op.where.Rank = { $gt: carousel.Rank };
      op.order = [['Rank', 'ASC']]
    }
    else {  //下移
      op.where.Rank = { $lt: carousel.Rank };
      op.order = [['Rank', 'DESC']]
    }

    const dstCarousel = await Carousel.findOne(op)
      .catch(err => logger.error(`admin.updateCarousel查询2失败，${err.message}`));
    if (!dstCarousel) return endfor(ET.记录不存在);

    const rank = carousel.Rank;
    let count = 0;
    //开启事务更新
    carousel = await mysql.transaction(() => {
      carousel.update({ Rank: dstCarousel.Rank })
        .then(() => dstCarousel.update({ Rank: rank }))
    }).catch(err => logger.error(`admin.updateCarousel更新2失败`));
  }

  return endfor(carousel ? ET.成功 : ET.数据异常);
}
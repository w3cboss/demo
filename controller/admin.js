'use strict';

const mysql = require('../lib/mysql');
const Sequelize = require('sequelize');
const lodash = require('lodash');
const fs = require('fs');
const xlsx = require('node-xlsx');
const path = require('path');

const ET = require('../ET');
const tools = require('../lib/tools');

const { User, Level, Dept, Post, Privilege, Carousel } = mysql.models;
const logger = global.logger;
const config = global.config;

module.exports = { getLevelList, addLevel, updateLevel, getDeptList, addDept,
  updateDept, getUserPage, addUser, importUsers, updateUser, getPostPage, updatePost,
  getCarouselList, getCarouselInfo, addCarousel, updateCarousel
 };

/**
 * 获取部门等级列表
 * @param {*} param0 
 */
async function getLevelList({ params, endfor }) {
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

  let level = await Level.find({
    where: { Name: name },
    attributes: ['name'],
    raw: true
  }).catch(err => logger.error(`admin.addLevel查询level失败,${err.message}`));
  if (level) return endfor(ET.记录已存在);

  //所有已存在的记录rank+1
  level = await mysql.transaction(async () => {
    await Level.update(
      { Rank: mysql.literal('`rank` + 1') },
      { where: { State: 0 } });
  }).then(async () =>
    await Level.create({ Name: name })
  ).catch(err => logger.error(`admin.addLevel新增失败,${err.message}`));

  return endfor(level ? 成功 : 数据异常);
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
  if (!isNaN(id)) return endfor(ET.参数内容不合法);

  const level = await Level.findOne({ Id: +id })
    .catch(err => logger.error(`admin.updateLevel查询1失败，${err.message}`));
  if (!level) return endfor(ET.记录不存在);

  let count = 0;
  if (name) {
    count = await Level.update(
      { Name: name },
      { where: { Id: +id } })
      .catch(err => logger.error(`admin.updateLevel更新name失败，${err.message}`));
  } else if (state) {
    count = await Level.update(
      { State: state },
      { where: { Id: +id } })
      .catch(err => logger.error(`admin.updateLevel更新state失败，${err.message}`));
  } else if (type) {
    const op = {};
    if (type === 0) { //上移
      op.where = { Rank: { [Sequelize.Op.gt]: level.Rank } };
      op.order = [['Rank', 'ASC']]
    }
    else {
      op.where = { Rank: { [Sequelize.Op.lt]: level.Rank } };
      op.order = [['Rank', 'DESC']]
    }

    const dstLevel = await Level.findOne(op)
      .catch(err => logger.error(`admin.updateLevel查询2失败，${err.message}`));
    if (!dstLevel) return endfor(26);

    const rank = level.Rank;
    level = await level.update({ Rank: dstLevel.Rank })
      .tap(() => count++)
      .catch(err => logger.error(`admin.updateLevel更新rank1失败，${err.message}`));

    dstLevel = await dstLevel.update({ Rank: rank })
      .tap(() => count++)
      .catch(err => logger.error(`admin.updateLevel更新rank2失败，${err.message}`));
  }
  return endfor(count ? 40 : 0);
}


async function getDeptList({ params, endfor }) {
  const { levelId } = params;
  if (!levelId) return endfor(20);

  const depts = await Dept.findAll({
    where: { LevelId: levelId, State: 0 },
    raw: true
  }).catch(err => logger.error(`admin.getDeptList查询dept失败，${err.message}`));

  if (!depts) return endfor(40);
  return endfor(0, { items: depts });
}

/**
 * 新增部门
 * @param {*} params
 * @param {*} params.id 部门等级
 * @param {*} params.name 部门名称
 */
async function addDept({ params, endfor }) {
  const { id, name } = params;
  if (!(id && name)) return endfor(20);

  const level = await Level.findOne({
    where: { Id: +id, State: 0 }
  }).catch(err => `admin.addDept查询level失败，${err.message}`);
  if (level) return endfor(25);

  let dept = await Dept.findOne({
    where: { Name: name, State: 0 }
  }).catch(err => `admin.addDept查询dept失败，${err.message}`);
  if (dept) return endfor(107);

  dept = await Dept.create({
    Name: name, LevelId: +id
  }).catch(err => `admin.addDept查询dept失败，${err.message}`);

  return endfor(dept ? 0 : 40);
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
  if (!id || !(name && state)) return endfor(20);

  let dept = await Dept.findOne({
    where: { Id: +id }
  }).catch(err => logger.error(`admin.updateDept查询dept1失败，${err.message}`));
  if (!dept) return endfor(25);

  let count = 0;
  if (name) {
    const de = await Dept.findOne({
      where: { Name: name }
    }).catch(err => logger.error(`admin.updateDept查询dept2失败，${err.message}`));
    if (de) return endfor(107);

    count = await dept.update({ Name: name })
      .catch(err => logger.error(`admin.updateDept更新name失败，${err.message}`));
  } else {
    count = await dept.update({ State: +state })
      .catch(err => logger.error(`admin.updateDept更新state失败，${err.message}`));
  }
  return endfor(count ? 0 : 40);
}

/**
 * 
 * @param {*} param0 
 */
async function getUserPage({ params, endfor }) {
  const { deptId, key, page = 1, size = 10 } = params;
  const where = {};
  if (deptId) where.DeptId = { [Sequelize.Op.in]: deptId.split(',') };
  if (key) where.Key = key;

  const { count, rows } = await User.findAndCountAll({
    where,
    raw: true,
    offset: (page - 1) * size,
    limit: size
  }).catch(err => logger.error(`admin.getUsers查询users失败，${err.message}`));

  if (!rows) return endfor(40);
  return endfor(0, { count, items: rows });
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
  if (!number || !name || !isNaN(deptId))
    return endfor(20);

  let user = await User.findOne({
    where: {
      $or: [{ Number: +number }, { Name: name }],
      State: 0
    }
  }).catch(err => logger.error(`admin.addUser查询user失败，${err.message}`));
  if (user) return endfor(107);

  const dept = await Dept.findOne({
    where: { Id: +id }
  }).catch(err => logger.error(`admin.addUser查询dept失败，${err.message}`));
  if (!dept) return endfor(25);

  user = User.create({
    Number: number, Name: name, DeptId: +deptid, Pass: number,
    Key: `${name}_${number}`, Avater: config.defaultAvater
  }).catch(err => logger.error(`admin.addUser新增失败，${err.message}`));
  return endfor(user ? 0 : 40);
}

/**
 * 
 * @param {*} params
 */
async function importUsers({ params, endfor }) {
  const filePath = config.tmpPath;
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(filePath);
  }

  const options = {};
  //尝试保存上传的附件
  const fileNames = await tools.busboy(ctx, filePath, ['user'], options)
    .catch(err => logger.error(`${err.message}`));
  if (!fileNames || fileNames.length === 0) return endfor(ET.文件上传失败);

  const absolutePath = path.join(filePath, fileNames[0]);
  const data = xlsx.parse(absolutePath);
  fs.unlink(absolutePath);

  if (!data || data.length === 0) return endfor(ET.文件格式不正确);
  const lines = data[0].data;
  if (!lines || lines.length === 0) return endfor(ET.文件格式不正确);

  //number去重
  const numbers = lines.Map(line => line[0]);
  const users = await User.findAll({
    attributes: ['Number'],
    where: {
      State: 0,
      Number: { $in: numbers }
    }
  }).catch(err => logger.error(`admin.importUser查询user失败,${err.message}`));
  if (!users) return endfor(ET.数据异常);
  if (user.length > 0) return endfor(ET.记录已存在, { items: users.Map(user => user.Number) });

  const depts = await Dept.findAll({
    attributes: ['Id', 'Name'],
    where: {
      State: 0
    }
  }).catch(err => logger.error(`admin.importUser查询dept失败,${err.message}`));
  if (!depts) return endfor(ET.数据异常);

  const deptMap = new Map();
  depts.forEach(dept => {
    deptMap[dept.Name] = deptMap[dept.Id]
  });

  const values = [];
  lines.forEach(line => {
    if (!deptMap.keys.includes(line[2])) return;
    values.push({
      Number: line[0], Name: line[1], DeptId: deptMap[line[2]], Pass: line[0],
      Key: `${name}_${number}`, Avater: config.defaultAvater
    })
  });

  const users = await User.bulkCreate(values)
    .catch(err => logger.error(`admin.importUser插入失败,${err.message}`));
  if (!users) return endfor(ET.数据异常);

  return endfor(ET.成功, { count: users.length });
}

/**
 * 更新用户信息
 * @param {*} params
 */
async function updateUser({ params, endfor }) {
  const { id, pass, number, name, deptid, isadmin, state, privilege } = params;
  if (!id || !(number && name && deptid && pass && isadmin && state))
    return endfor(ET.缺少必须参数);
  if (privilege) {
    const types = privilege.split(',');
    if (types.length > 0) {
      let valid = true;
      types.forEach(type => valid &= isNaN(type));
      if (!valid) return endfor(ET.参数内容不合法);
    }
  }

  let user = User.findOne({
    where: { Id: id }
  }).catch(err => `updateUser查询user1失败,${err.message}`);
  if (!user) return endfor(ET.记录不存在);

  const values = {};
  if (number || name) {
    user = await User.findOne({
      where: {
        $or: [{ Number: +number }, { Name: name }],
        State: 0
      }
    }).catch(err => logger.error(`updateUser查询user2失败，${err.message}`));
    if (user) return endfor(ET.记录已存在);
  }

  if (deptid) {
    const dept = await Dept.findOne({
      where: { Id: +id }
    }).catch(err => logger.error(`updateUser查询dept失败，${err.message}`));
    if (!dept) return endfor(ET.记录不存在);
  }

  user = mysql.transaction(async () => {
    await Privilege.destroy({
      where: { UserId: id }
    });
  }).then(async () => {
    const types = privilege.split(',');
    await Privilege.bulkCreate(types.Map(type => {
      return { UserId: id, Type: type };
    }))
  }).then(async () => {
    const values = lodash.pick(params, ['number', 'name',
      'deptid', 'pass', 'isadmin', 'state']);
    return await user.update(values);
  }).catch(err => logger.error(`admin.updateUser更新失败,${err.message}`));

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
  if (!isNaN(id) || type < 1 || type > 2)
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
  if (!isNaN(id)) return endfor(ET.参数内容不合法);

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
  const { title, url, postId };
  if (!(url && postId))
    return endfor(ET.缺少必须参数);
  if (ur.length > 128 || (title && title.length > 128) || !isNaN(postId))
    return endfor(ET.参数不合法);

  const post = await Post.findById(postId, {
    where: { State: 0 }
  }).catch(err => logger.error(`admin.addCarousel查询post失败,${err.message}`));
  if (!post) return endfor(ET.记录不存在);

  //所有已存在的记录rank+1
  const carousel = await mysql.transaction(async () => {
    await Carousel.update(
      { Rank: mysql.literal('`rank` + 1') },
      { where: { State: 0 } });
  }).then(async () =>
    await Carousel.create({
      PostId: postId, Title: title, UserId: user.Id,
      Url: url
    })
  ).catch(err => logger.error(`admin.addCarousel更新失败,${err.message}`));
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
  if (!isNaN(id) || (postId && !isNaN(postId))
    || (type && (type < 0 || type > 1))
    || (state && (state < 0 || state > 1)))
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
    mysql.transaction(async () => {
      await carousel.update({ Rank: dstCarousel.Rank })
        .tap(() => count++);
    }).then(async () => {
      await dstCarousel.update({ Rank: rank })
        .tap(() => count++);
    }).catch(err => logger.error(`admin.updateCarousel更新2失败`));
    if (count !== 2) return endfor(ET.数据异常);
  }

  return endfor(ET.成功);
}

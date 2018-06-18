const Sequelize = require('sequelize');
const lodash = require('lodash');

const mysql = require('../lib/mysql');
const tools = require('../lib/tools')

const ET = require('../ET');

const { User, Carousel, Post } = mysql.models;
const logger = global.logger;
const { cookieKey } = global.config;

module.exports = {};

/**
 * 获取轮播图列表
 * @param {*} param0 
 */
async function getList({ params, endfor }) {
  const carousels = await Carousel.findAll({
    attributes: ['Id', 'Title', 'Rank', 'Url'],
    where: { State: 0 },
    order: [['Rank', 'ASC']],
    include: {
      model: Post,
      attributes: ['Id', 'Title']
    },
    raw: true
  }).catch(err => logger.error(`carousel.getList查询失败,${err.message}`));
  if (!carousels) return endfor(ET.数据异常);

  return endfor(ET.成功, { items: carousels });
}

/**
 * 获取轮播图信息
 * @param {} param0 
 */
async function getInfo({ params, endfor }) {
  const { id } = params;
  if (!id) return endfor(ET.缺少必须参数);
  if (!isNaN(id)) return endfor(ET.参数内容不合法);

  const carousels = await Carousel.findById(id, {
    where: { State: 0 },
    include: {
      model: Post,
      attributes: ['Id', 'Title']
    }
  }).catch(err => logger.error(`carousel.getInfo查询失败,${err.message}`));
  if (!carousels) return endfor(ET.记录不存在);

  return endfor(ET.成功, { items: carousels });
}

/**
 * 添加轮播图
 * @param {} param0 
 */
async function add({ params, user, endfor }) {
  const { title, url, postId };
  if (!(url && postId))
    return endfor(ET.缺少必须参数);
  if (ur.length > 128 || (title && title.length > 128) || !isNaN(postId))
    return endfor(ET.参数不合法);

  const post = await Post.findById(postId, {
    where: { State: 0 }
  }).catch(err => logger.error(`carousel.add查询post失败,${err.message}`));
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
  ).catch(err => logger.error(`carousel.add失败,${err.message}`));
  if (!carousel) return endfor(ET.数据异常);

  return endfor(ET.成功);
}

/**
 * 修改轮播图
 * @param {*} param0 
 */
async function update({ params, endfor }) {
  const { id, postId, title, type, state } = params;

  if (!id || !(postId && title && type && state))
    return endfor(ET.缺少必须参数);
  if (!isNaN(id) || (postId && !isNaN(postId))
    || (type && (type < 0 || type > 1))
    || (state && (state < 0 || state > 1)))
    return endfor(ET.参数内容不合法);

  let carousel = await Carousel.findById(id, {
    where: { State: 0 }
  }).catch(err => logger.error(`carousel.update查询1失败，${err.message}`));
  if (!carousel) return endfor(ET.记录不存在);

  let count = 0;
  const update = {};
  if (title) update.Title = title;
  if (state) update.State = state;
  if (postId) {
    const post = Post.findById(postId, {
      where: { State: 0 }
    }).catch(err => `carousel.update查询post失败,${err.message}`);
    if (!post) return endfor(ET.记录不存在);

    update.PostId = postId;
  }

  if (lodash.keys(update).length > 0) {
    carousel = carousel.update(update)
      .catch(err => logger.error(`carousel.update更新1失败,${err.message}`));
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
      .catch(err => logger.error(`carousel.update查询2失败，${err.message}`));
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
    }).catch(err => logger.error(`carousel.edit更新2失败`));
    if (count == 0) return endfor(ET.数据异常);
  }

  return endfor(ET.成功);
}

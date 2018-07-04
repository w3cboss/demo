'use strict';

const Sequelize = require('sequelize');
const lodash = require('lodash');

const mysql = require('../lib/mysql');
const tools = require('../lib/tools')
const redis = require('../lib/redis');
const ET = require('../ET');

const { User, Post, Dept, PostDept, Reply, Tip } = mysql.models;
const logger = global.logger;

const { checkpara_int, checkpara_str } = tools;

module.exports = { getPage, publish, getInfo, del };

/**
 * 获取帖子列表
 * @param {string} key 关键字 
 * @param {int} page 页码
 * @param {int} size 页面大小
 * @param {int} isme 是否查看本人帖子 1-是
 */
async function getPage({ params, user, endfor }) {
  const { key, page = 1, size = 20, isme = 0 } = params;
  if (!checkpara_int(page) || !checkpara_int(size)) 
    return endfor(ET.缺少必须参数);

  const where = { State: Post.ESTATE.启用 };
  if (isme) {
    where.UserId = user.Id;
    where.State = {
      $in: [Post.ESTATE.启用, Post.ESTATE.草稿]
    }
  }
  if (key) where.Title = { $like: `%${key}%` };

  const results = await Post.findAndCountAll({
    attributes: ['Id', 'Title', 'UserId', 'Count', 'State', 'CreateTime', 'IsTop'],
    where,
    raw: true,
    include: {
      model: 'PostDept',
      where: {
        $or: [{ IsPublic: 0 }, { DeptId: user.DeptId }]   //fix me
      },
      require: true
    },
    order: [['IsTop', 'DESC'], ['CreateTime', 'DESC']],
    limit: size,
    offset: (page - 1) * size,
  }).catch(err => logger.error(`post.getpage查询失败,${err.message}`));

  if (!results) return endfor(ET.数据异常);
  return endfor(ET.成功, { count: results.count, items: result.rows });
}

/**
 * 发布帖子(存为草稿)
 * @param {int} is_attach 是否允许上传附件
 * @param {int} is_public 帖子是否公开可见
 */
async function publish({ params, user, endfor }) {
  const { id, title, state = Post.ESTATE.启用, is_public = 1, is_attach = 0, 
    dept_id, content } = params;

  if (!(title && content)) return endfor(ET.缺少必须参数);
  if (!checkpara_str(title, 1, 128)) return endfor(ET.参数不合法);
  if (!checkpara_str(content)) return endfor(ET.参数不合法);
  if (!checkpara_int(is_public, 0, 1)) return endfor(ET.参数不合法);
  if (!checkpara_int(is_attach, 0, 1)) return endfor(ET.参数不合法);
  if (!checkpara_int(state, Post.ESTATE.启用, Post.ESTATE.草稿))
  return endfor(ET.参数不合法);
  if (is_public != 0 && !/^\d+(,\d+)*$/.test(dept_id))
    return endfor(ET.参数不合法);
  if (+is_attach === 1 && user.IsAdmin !== 1)
    return endfor(ET.没有权限);

  let post;
  if (id) {
    post = Post.find({
      where: { Id: id, State: Post.ESTATE.启用 }
    }).catch(err => logger.error(`post.publish查询失败,${err.message}`));
    if (!post) return endfor(ET.记录不存在);

    post = post.update({
      Content, content, IsPublic: is_public,
      Title: title, State: state, AllowAttach: is_attach
    }).catch(err => logger.error(`post.publish更新失败,${err.message}`));
    if (!post) return endfor(ET.数据异常);

  } else {
    post = post.create({
      UserId: user.Id, Content, content, IsPublic: is_public,
      Title: title, State: state, AllowAttach: is_attach
    }).catch(err => logger.error(`post.publish更新失败,${err.message}`));

    if (!post) return endfor(ET.数据异常);
  }

  //创建可见关系记录
  if (dept_id) {
    const postDepts = await mysql.transaction(() =>
      PostDept.destroy({
        where: { PostId: post.Id }
      }).then(() =>
        PostDept.bulkCreate(dept_id.split(',').map(id => {
          return { PostId: postid, DeptId: +id }
        })))
    ).catch(err => logger.error(`post.publish增删PostDept失败,${err.message}`));

    if (!postDepts) return endfor(ET.数据异常);
  }

  return endfor(ET.成功);
}

/**
 * 删除帖子
 * @param {*} param0 
 */
async function del({ params, user, endfor }) {
  const { id } = params;
  if (!id) return endfor(ET.缺少必须参数);

  const post = await Post.find({
    where: {
      Id: id,
      State: {
        $not: Post.ESTATE.删除
      }
    }
  }).catch(err => logger.error(`post.del查询失败,${err.message}`));

  if (!post) return endfor(ET.记录不存在);
  if (post.Id !== user.Id)
    return endfor(ET.没有权限);

  post = await post.update({ State: Post.ESTATE.删除 })
    .create(err => logger.error(`post.del删除失败,${err.message}`));
  if (!post) return endfor(ET.数据异常);

  return endfor(ET.成功);
}

/**
 * 查询帖子内容
 * @param {*} param0 
 */
async function getInfo({ params, endfor }) {
  const { id } = params;
  if (!id) return endfor(ET.缺少必须参数);

  let post = await Post.findById(id, {
    attributes: ['Title', 'UserId', 'IsAllowAttach', 'Content',
      'Count', 'CreateTime'],
    where: {
      State: {
        $not: Post.ESTATE.删除
      }
    },
    include: {
      model: User,
      attributes: ['Number', 'Name', 'Avater', 'State'],
      require: true
    },
    raw: true
  }).catch(err => logger.error(`post.getInfo查询失败,${err.message}`));
  if (!post) return endfor(ET.记录不存在);

  post = await post.update({
    Count: mysql.literal('`count` + 1')
  }).catch(err => logger.error(`post.getInfo更新失败,${err.message}`));
  if (!post) return endfor(ET.数据异常);

  return endfor(ET.成功, post);
}

/**
 * 查看自己的帖子
 * @param {*} param0 
 */
async function getDetail({ params, user, endfor }) {
  const { id } = params;
  if (!id) return endfor(ET.缺少必须参数);

  const post = await Post.find({
    where: {
      Id: +id,
      State: {
        $not: Post.ESTATE.删除
      }
    }
  }).catch(err => logger.error(`post.getdetail查询失败,${err.message}`));
  if (!post) return endfor(ET.记录不存在);
  if (post.Id !== user.Id)
    return endfor(ET.没有权限);

  //帖子为不公开，获取允许查看的部门
  if (post.IsPublic !== 1) {
    const depts = await PostDept.findAll({
      where: { PostId: post.Id },
      include: {
        model: Dept,
        where: { State: 0 },
        require: true,
        attributes: ['Name']
      },
      raw: true
    }).catch(err => logger.error(`post.getdetail查询dept失败,${err.message}`));

    post.depts = depts;
  }
  return endfor(ET.成功, post);
}

/**
 * 获取评论列表
 * @param {*} param0 
 */
async function getReplys({ params, endfor }) {
  const { id, page = 1, size = 10 } = params;
  if (!id) return endfor(ET.缺少必须参数);

  const post = await Post.findById(+id, {
    where: { State: Post.ESTATE.启用 }
  }).catch(err => logger.error(`post.getReplys查询post失败,${err.message}`));
  if (!post) return endfor(ET.记录不存在);

  const replys = await Reply.findAndCount({
    where: {
      PostId: id,
      State: 0,
      Type: Reply.ETYPE.一级回复
    },
    limit: size,
    offset: (page - 1) * size,
    include: {
      model: Reply,
      where: { State: 0 },
      include: {
        model: User,
        attributes: ['Id', 'Name', 'Avater']
      },
    },
    order: [['Id', 'DESC']],
    raw: true,
  }).catch(err => logger.error(`post.getReplys查询`));
  if (!replys) return endfor(ET.数据异常);

  return endfor(ET.成功, { items: replys.rows, count: replys.count });
}

/**
 * 发表评论
 * @param {*} param0 
 */
async function sendReply({ params, user, endfor }) {
  const { id, replyId1, replyId2 } = params;
  if (!id) return endfor(ET.缺少必须参数);

  const post = await Post.findById(+id, {
    where: { State: Post.ESTATE.启用 }
  }).catch(err => logger.error(`post.setReply查询post失败,${err.message}`));
  if (!post) return endfor(ET.记录不存在);

  const value = {
    PostId: id, UserId: user.Id, Type: type
  };
  value.Type = Reply.ETYPE.一级回复;
  let beUserId = post.UserId; //被回复人id
  if (replyId1) {
    const reply = await Reply.find({
      where: {
        ReplyId1: +replyId1,
        State: 0
      }
    }).catch(err => logger.error(`post.setReply查询reply1失败,${err.message}`));
    if (!reply) return endfor(ET.记录不存在);

    value.ReplyId1 = replyId1;
    value.Type = Reply.ETYPE.二级回复;
    beUserId = reply.UserId;
  }

  if (replyId2) {
    const reply = await Reply.find({
      where: {
        ReplyId2: +replyId2,
        State: 0
      }
    }).catch(err => logger.error(`post.setReply查询reply2失败,${err.message}`));
    if (!reply) return endfor(ET.记录不存在);

    value.ReplyId2 = replyId2;
    value.Type = Reply.ETYPE.三级回复;
    beUserId = reply.UserId;
  }

  const tip = await mysql.transaction(() =>
    Reply.create(value).then(() => {
      return Tip.create({
        PostId: id, UserId: beUserId,
        ReplyUserId: user.Id, ReplyId: reply.Id
      })
    })
  ).catch(err => logger.error(`post.setReply创建失败,${err.message}`));
  if (!tip) return endfor(ET.数据异常);

  return endfor(ET.成功);
}

/**
 * 删除回复
 * @param {*} param0 
 */
async function deleteReply({ params, user, endfor }) {
  const { id } = params;
  if (!id) return endfor(ET.缺少必须参数);
  if (!isNaN(id)) return endfor(ET.参数不合法);

  const reply = Reply.findById(id, {
    where: {
      State: 0
    }
  }).catch(err => logger.error(`post.deleteReply查询失败,${err.message}`));
  if (!reply) return endfor(ET.记录不存在);

  if (reply.UserId !== user.Id) return endfor(ET.没有权限);

  const count = await Reply.destroy({
    where: {
      Id: id,
      State: 0
    }
  }).catch(err => logger.error(`post.deleteReply删除失败,${err.message}`));
  if (count !== 1) return endfor(ET.数据异常);

  return endfor(ET.成功);
}

/**
 * 获取回复提示页
 * @param {*} param0 
 */
async function getTipPage({ params, user, endfor }) {
  const { page = 1, size = 20 } = params;
  const result = await Tip.findAndCount({
    where: {
      UserId: user.Id,
    },
    order: [['Id', 'DESC']],
    include: [
      {
        model: 'Post',
        attributes: ['State', 'Id', 'Title'],
        require: true
      },
      {
        model: 'User',
        attributes: ['Id', 'Name'],
        require: true
      }
    ],
    limit: size,
    offset: (page - 1) * size
  }).catch(err => logger.error(`post.getTipPage查询tip失败,${err.message}`));
  if (!result) return endfor(ET.数据异常);

  Tip.update({ State: 1 }, { where: { UserId: user.Id } })
    .catch(err => logger.error(`post.getTipPage更新tip失败,${err.message}`));

  const { rows, count } = result;
  return endfor(ET.成功, { count, items: rows });
}
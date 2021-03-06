const send = require('koa-send');
const fs = require('fs');

const mysql = require('../lib/mysql');
const tools = require('../lib/tools')

const ET = require('../ET');

const { User, Post, PostDept, Attach } = mysql.models;
const logger = global.logger;
const config = global.config;

const { checkpara_int, checkpara_str } = tools;

module.exports = { uploadAttach, getList, getInfo, download };

/**
 * 上传附件(交作业)
 * @param {} ctx 
 */
async function uploadAttach(ctx) {
  const { params, user, endfor } = ctx;
  const { id } = params;
  if (!id) return endfor(ET.缺少必须参数);
  if (!checkpara_int(id)) return endfor(ET.参数内容不合法);

  const post = await Post.findOne({
    where: { 
      Id: +id,
      State: 0 
    },
    include: {
      model: PostDept
    }
  }).catch(err => logger.error(`attach.upload查询post失败,${err.message}`));
  if (!post) return endfor(ET.记录不存在);

  if (post.AllowAttach !== 1)
    return endfor(ET.没有权限);
  if (!post.IsPublic) {
    const deptIds = post.PostDepts.map(row => row.DeptId);
    if (!deptIds.includes(user.DeptId)) return endfor(ET.没有权限);
  }

  const { fileSize, files } = config.attachOptions;
  const options = {
    limits: {
      fileSize: fileSize || 1024 * 1024 * 10,
      files: files || 1,
    },
  };
  const filePath = `${config.attachPath}/${id}/${user.Id}`;
  if (!fs.existsSync(filePath)) {
    tools.mkMultiDir(filePath);
  }
  //尝试保存上传的附件
  const fileNames = await tools.saveFile(ctx, filePath, 'attach', options)
    .catch(err => logger.error(`${err.message}`));
  if (!fileNames || fileNames.length === 0) return endfor(ET.文件上传失败);

  let attach = await Attach.find({
    where: {
      PostId: +id,
      UserId: user.Id,
      State: 0
    }
  }).catch(err => logger.error(`attach.upload查询attach失败,${err.message}`));

  const fileName = fileNames[0].fileName;
  if (attach) {
    attach = await attach.update({
      Name: fileName
    }).catch(err => logger.error(`attach.upload更新attach失败,${err.message}`))
  } else {
    attach = await Attach.create({
      PostId: +id, UserId: user.Id,
      Name: fileName
    }).catch(err => logger.error(`attach.upload创建attach失败,${err.message}`));
  }
  if (!attach) return endfor(ET.数据异常);

  return endfor(ET.成功);
}

/**
 * 获取某帖子的上传附件列表
 * @param {*} param0 
 */
async function getList({ params, user, endfor }) {
  const { id } = params;
  if (!id) return endfor(ET.缺少必须参数);
  if (!checkpara_int(id)) return endfor(ET.参数内容不合法);

  if (user.IsAdmin !== 1) return endfor(ET.没有权限);

  const post = await Post.findOne({
    where: { 
      Id: +id,
      State: 0 
    }
  }).catch(err => logger.error(`attach.getlist查询post失败,${err.message}`));
  if (!post) return endfor(ET.记录不存在);

  if (post.UserId !== user.Id) return endfor(ET.没有权限);

  const attaches = await Attach.findAll({
    attributes: ['Id', 'Name', 'create_time'],
    where: {
      PostId: +id,
      State: 0
    },
    include: {
      model: User,
      where: { State: 0 },
      require: true,
      attributes: ['Id', 'Name', 'Avater']
    }
  }).catch(err => logger.error(`attach.getlist查询attach失败,${err.message}`));
  if (!attaches) return endfor(ET.数据异常);

  return endfor(ET.成功, { items: attaches });
}

/**
 * 获取自己在某帖子上传的附件信息
 * @param {} param0 
 */
async function getInfo({ params, user, endfor }) {
  const { id } = params;
  if (!id) return endfor(ET.缺少必须参数);
  if (!checkpara_int(id)) return endfor(ET.参数内容不合法);

  const post = await Post.findOne({
    where: {
      Id: +id,
      State: 0
    }
  }).catch(err => logger.error(`attach.getinfo查询post失败,${err.message}`));
  if (!post) return endfor(ET.记录不存在);

  //省略校验post是否允许上传附件，用户是否有权限上传
  const attach = await Attach.find({
    attributes: ['Id', 'Name', 'create_time' ],
    where: {
      UserId: user.Id,
      PostId: +id,
    }
  }).catch(err => logger.error(`attach.getinfo查询attach失败,${err.message}`));
  if (!attach) return endfor(ET.记录不存在);

  return endfor(ET.成功, attach);
}

/**
 * 下载附件
 * @param {*} ctx 
 */
async function download(ctx) {
  const { params, user, endfor } = ctx;
  const { id } = params;
  if (!id) return endfor(ET.缺少必须参数);
  if (!checkpara_int(id)) return endfor(ET.参数不合法);

  const attach = await Attach.findOne({
    where: {
      Id: +id
    },
    include: {
      model: Post,
      where: { State: 0 },
      require: true
    }
  }).catch(err => logger.error(`attach.download查询attach失败,${err.message}`));
  if (!attach) return endfor(ET.记录不存在);

  if (attach.Post.UserId !== user.Id)
    return endfor(ET.没有权限);

  const filePath = `${config.attachPath}/${attach.Post.Id}/${user.Id}`;
  if (!fs.existsSync(filePath)) return endfor(ET.文件不存在);

  ctx.attachment(attach.Name);
  await send(ctx, attach.Name, { root: filePath });
}
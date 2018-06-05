const mysql = require('../lib/mysql');
const Promise = require('bluebird');
const Sequelize = require('sequelize');
const lodash = require('lodash');

const { User, Level, Dept } = mysql.models;
const logger = global.logger;

module.exports = { getLevels, addLevel };

/**
 * 获取部门等级列表
 * @param {*} param0 
 */
async function getLevels({ params, endfor }) {
  const levels = await Level.findAll({
    where: { State: 0 },
    raw: true
  }).catch(err => logger.error(`getLevels查询level失败,${err.message}`));

  if (!levels) return endfor(40);
  return endfor(0, { items: levels });
}

/**
 * 新增部门等级
 * @param {object} params
 * @param {string} params.name
 */
async function addLevel({ params, endfor }) {
  const { name } = params;
  if (!name) return endfor(20);

  let level = await Level.find({
    where: { Name: name },
    attributes: ['name'],
    raw: true
  }).catch(err => logger.error(`addLevel查询level失败,${err.message}`));
  if (level) return endfor(25);

  //所有已存在的记录rank+1
  level = await mysql.transaction(async () => {
    await Level.update({ Rank: mysql.literal('`rank` + 1') }, { where: { State: 0 } });
  }).then(async () =>
    await Level.create({ Rank: 0, Name: name })
  ).catch(err => logger.error(`addLevel新增失败,${err.message}`));

  return endfor(level ? 0 : 40);
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
  if (!id || !isNaN(id)) return endfor(20);

  const level = await Level.findOne({ Id: +id })
    .catch(err => logger.error(`updateLevel查询1失败，${err.message}`));
  if (!level) return endfor(25);

  let count = 0;
  if (name) {
    count = await Level.update(
      { Name: name },
      { where: { Id: +id } })
      .catch(err => logger.error(`updateLevel更新name失败，${err.message}`));
  } else if (state) {
    count = await Level.update(
      { State: state },
      { where: { Id: +id } })
      .catch(err => logger.error(`updateLevel更新state失败，${err.message}`));
  } else if (type) {
    const options = {};
    if (type === 0) { //上移
      op.where = { Rank: { [Sequelize.Op.gt]: level.Rank } };
      op.order = [['Rank', 'ASC']]
    }
    else {
      op.where = { Rank: { [Sequelize.Op.lt]: level.Rank } };
      op.order = [['Rank', 'DESC']]
    }

    const dstLevel = await Level.findOne(options)
      .catch(err => logger.error(`updateLevel查询2失败，${err.message}`));
    if (!dstLevel) return endfor(26);

    const rank = level.Rank;
    level = await level.update({ Rank: dstLevel.Rank })
      .tap(count++)
      .catch(err => logger.error(`updateLevel更新rank1失败，${err.message}`));

    dstLevel = await dstLevel.update({ Rank: rank })
      .tap(count++)
      .catch(err => logger.error(`updateLevel更新rank2失败，${err.message}`));
  }
  return endfor(count ? 40 : 0);
}


async function getDpets({ params, endfor }) {
  const { levelId } = params;
  if (!levelId) return endfor(20);

  const depts = await Dept.findAll({
    where: { LevelId: levelId, State: 0 },
    raw: true
  }).catch(err => logger.error(`getDpets查询dept失败，${err.message}`));

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
  }).catch(err => `addDept查询level失败，${err.message}`);
  if (level) return endfor(25);

  let dept = await Dept.findOne({
    where: { Name: name, State: 0 }
  }).catch(err => `addDept查询dept失败，${err.messag}`);
  if (dept) return endfor(107);

  dept = await Dept.create({
    Name: name, LevelId: +id
  }).catch(err => `addDept查询dept失败，${err.message}`);

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
  }).catch(err => logger.error(`updateDept查询dept1失败，${err.messag}`));
  if (!dept) return endfor(25);

  let count = 0;
  if (name) {
    const de = await Dept.findOne({
      where: { Name: name }
    }).catch(err => logger.error(`updateDept查询dept2失败，${err.messag}`));
    if (de) return endfor(107);

    count = await dept.update({ Name: name })
      .catch(err => logger.error(`updateDept更新name失败，${err.messag}`));
  } else {
    count = await dept.update({ State: +state })
      .catch(err => logger.error(`updateDept更新state失败，${err.messag}`));
  }
  return endfor(count ? 0 : 40);
}

/**
 * 
 * @param {*} param0 
 */
async function getUsers({ params, endfor }) {
  const { deptId, key, page = 1, size = 10 } = params;
  const where = {};
  if (deptId) where.DeptId = { [Sequelize.Op.in]: deptId.split(',') };
  if (key) where.Key = key;

  const { count, rows } = await User.findAndCountAll({
    where,
    raw: true,
    offset: (page - 1) * size,
    limit: size
  }).catch(err => logger.error(`getUsers查询users失败，${err.messag}`));

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
      [Op.or]: [{ Number: +number }, { Name: name }],
      State: 0
    }
  }).catch(err => logger.error(`addUser查询user失败，${err.messag}`));
  if (user) return endfor(107);

  const dept = await Dept.findOne({
    where: { Id: +id }
  }).catch(err => logger.error(`addUser查询dept失败，${err.messag}`));
  if (!dept) return endfor(25);

  user = User.create({
    Number: number, Name: name, DeptId: +deptid,
    Pass: number, Key: `${name}_${number}`
  }).catch(err => logger.error(`addUser新增失败，${err.messag}`));
  return endfor(user ? 0 : 40);
}

/**
 * 
 * @param {*} params
 */
async function importUsers({ params, endfor }) {

}

/**
 * 
 * @param {*} params
 */
async function updateUser({ params, endfor }) {
  const { id, number, name, deptid, isadmin, state } = params;
  if (!id || !(number && name && deptid && pass && isadmin && state))
    return endfor(20);
  
  let user = User.findOne({
    where: { Id: id }
  }).catch(err => `updateUser查询user1失败,${err.messag}`);
  if (!user) return endfor(25);

  const values = {};
  if (number || name) {
    user = await User.findOne({
      where: {
        [Op.or]: [{ Number: +number }, { Name: name }],
        State: 0
      }
    }).catch(err => logger.error(`updateUser查询user2失败，${err.messag}`));
    if (user) return endfor(107);
  } else if (deptid) {
    const dept = await Dept.findOne({
      where: { Id: +id }
    }).catch(err => logger.error(`updateUser查询dept失败，${err.messag}`));
    if (!dept) return endfor(25);
  }

  const values =  lodash.pick(params, ['number', 'name', 
    'deptid', 'isadmin', 'state']);
  user = await user.update(values)
    .catch(err => `updateUser更新user失败，${err.messag}`);
  
  return endfor(user ? 0 : 40);
}
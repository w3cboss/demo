const mysql = require('../lib/mysql');
const Promise = require('bluebird');
const { User, Level, Dept } = mysql.models;
const logger = global.logger;

module.exports = { addLevel };

/**
 * @param {object} param
 * @param {string} param.name
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
    await Level.update({ Rank: mysql.literal('`rank` + 1')}, { where: { State: 0 }});
  }).then(async () => 
    await Level.create({ Rank: 0, Name: name })
  ).catch(err => logger.error(`addLevel新增level失败,${err.message}`));

  return endfor(level ? 0 : 40);
}

/**
 * @param {object} param
 * @param {string} param.name
 */
async function updateLevel({ params, endfor }) {
  const { name, state, type } = params;

}


async function addDept() {

}

async function updateDept() {

}

async function addUser() {

}

async function importUsers() {

}

async function updateUser() {

}
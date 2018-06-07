'use strict';

const redis = require('../lib/redis');
const User = require('../model/user');
const sequelize = require('sequelize');

module.exports = {
  hi
}

async function hi({ params, endfor }) {

  const user = await User.findOne({ where: { Guid: 'test3' }, attributes: ['Guid'] });
  // User.create({ Guid: '2315648763213'})
  //   .then(user => console.log(user))
  //   .catch(err => console.log(err));
  // const d = await user.update({ Guid: 'tttest'});
  // const g = await User.update({ Guid: 'test3' },{ where: { Guid: 'test2'}})
  //   .catch(err => console.log(err));

  // const g = await user.update({ Guid: 'test3'})
  //   .catch(err => console.log(err));

  // user.Guid = 'test2';
  // const v = await user.save();

  // const g = await redis.exists('s');
  // const c = await redis.set('y','888');
  // const t = await redis.exists('j');
  // const j = await redis.del('s');
  // sequelize.Op.in
  // const users = await User.find({
  //   where: {
  //     // [sequelize.Op.or]: [
  //     //   { Guid: { [sequelize.Op.like]: '%12'} }, 
  //     //   { Guid: { [sequelize.Op.like]: '%12'} }
  //     // ]
  //     Guid: {}
  //   }
  // });

  const d = { a: 3 };
  const lodash = require('lodash');
  console.log(lodash.get(d, ['a', 'b']));


  // const { name } = params;
  // ctx.body = 213123
  return endfor(0);
}
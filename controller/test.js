'use strice';
const redis = require('../lib/redis');

module.exports = {
  hi
}

async function hi({ params, endfor }) {
  const { name } = params;
  // ctx.body = 213123
  throw new Error('sd');
  return endfor(0);
}
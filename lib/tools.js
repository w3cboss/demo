'use strict';

const crypto = require('crypto');

module.exports = { md5 };

function md5(str){
  const md5 = crypto.createHash("md5");
  return md5.update(str);
}
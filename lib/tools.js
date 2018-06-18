'use strict';
const Busboy = require('busboy');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const lodash = require('lodash');

module.exports = { md5, busboy };

function md5(str) {
  const md5 = crypto.createHash("md5");
  return md5.update(str);
}

// limits: {
//   fileSize: 1024 * 1024 * 10 ,
//   files: 1
// }
/**
 * 处理上传文件
 * @param {*} ctx 
 * @param {*} filePath 
 * @param {*} fieldName 
 * @param {*} ops 
 */
function busboy(ctx, filePath, fieldName, ops = {}) {
  return new Promise((resolve, reject) => {
    const options = Object.assign(ops, { headers: ctx.headers });
    const busboy = new Busboy(options);

    let done = false;
    let fileName;
    busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
      let tooLarge = false;

      file.on('data', () => lodash.noop);

      file.on('end', function () {
        if (!tooLarge && fieldName === fieldname) {
          const fstream = fs.createWriteStream(path.join(filePath, filename));
          file.pipe(fstream);
          done = true;
          fileName = filename;
        }
      });

      file.on('limit', () => {
        tooLarge = true;
        reject(new Error('文件大小超出最大限制'));
      });
    });

    busboy.on('finish', () => {
      done ? resolve(fileName) : reject(new Error('文件保存失败'));
    });

    busboy.on('filesLimit', () => {
      reject(new Error('文件数量超出最大限制'));
    })

    busboy.on('error', err => reject(err));
    ctx.req.pipe(busboy);
  });
}
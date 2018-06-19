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
async function busboy(ctx, filePath, fieldName, ops = {}) {
  const options = Object.assign(ops, { headers: ctx.headers });
  const busboy = new Busboy(options);

  return new Promise((resolve, reject) => {
    const files = [];
    busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
      let tooLarge = false;
      let content = '';

      file.on('data', (data) => content += data);

      file.on('end', () => {
        if (fieldName.includes(fieldname)) {
          files.push(new Promise((resolve, reject) => {
            const writeStream = fs.createWriteStream(path.join(filePath, filename));
            writeStream.write(content) ? resolve(filename) : reject(new Error('文件保存失败'));
          }));
        } else if (tooLarge)
          files.push(Promise.reject('文件数量超出最大限制'));
      });

      file.on('limit', () => {
        tooLarge = true;
      });
    });

    busboy.on('finish', () => {
      resolve(Promise.all(files))
    });

    busboy.on('filesLimit', () => {
      reject(new Error('文件数量超出最大限制'));
    })

    busboy.on('error', err => reject(err));
    ctx.req.pipe(busboy);
  });
};
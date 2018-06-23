'use strict';
const Busboy = require('busboy');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const lodash = require('lodash');

module.exports = { md5, saveFile, generatePass };

/**
 * 生成md5
 * @param {*} str 
 */
function md5(str) {
  const md5 = crypto.createHash("md5");
  return md5.update(str).digest('hex');
}


/**
 * 生成密码
 * @param {*} raw 
 */
function generatePass(pass, raw = true) {
  pass = raw ? md5(pass) : pass;
  pass = pass.substr(6, 16);
  return md5(pass).substr(7, 16);
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
async function saveFile(ctx, filePath, fieldNames, ops = {}) {
  const options = Object.assign(ops, { headers: ctx.headers });
  const busboy = new Busboy(options);

  const { allowExts } = ops; //指定允许上传的文件类型

  return new Promise((resolve, reject) => {
    const files = [];
    busboy.on('file', function (fieldName, file, fileName, encoding, mimetype) {
      let tooLarge = false;

      const absolutePath = path.join(filePath, fileName);
      const writeStream = fs.createWriteStream(absolutePath);

      file.on('data', (data) => writeStream.write(data));

      file.on('end', () => {
        writeStream.close();
        if (!fieldNames.includes(fieldName)) {
          fs.unlink(absolutePath, lodash.noop);
          return;
        }

        if (tooLarge) {
          files.push(Promise.reject(new Error('文件大小超出最大限制')));
          fs.unlink(absolutePath, lodash.noop);
          return;
        }

        const ext = path.extname(fileName);
        if (allowExts && !allowExts.includes(ext)) {
          files.push(Promise.reject(new Error('文件类型不合法')));
          fs.unlink(absolutePath, lodash.noop);
          return;
        }

        files.push(new Promise((resolve, reject) => {
          writeStream.on('error', err => {
            reject(err);
          }).on('close', () => {
            resolve({ fieldName, fileName });
          });
        }));
      });

      file.on('limit', () => {
        tooLarge = true;
      });
    });

    busboy.on('finish', () => {
      resolve(Promise.all(files));
    });

    busboy.on('filesLimit', () => {
      logger.warning('文件数量超出最大限制');
    })

    busboy.on('error', err => reject(err));
    ctx.req.pipe(busboy);
  });
};


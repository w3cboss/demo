'use strict';
const Busboy = require('busboy');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const lodash = require('lodash');
const uuid = require('uuid');

module.exports = { checkpara_int, checkpara_str, md5, saveFile, generatePass, mkMultiDir };

/**
 * 生成md5
 * @param {*} str 
 */
function md5(str) {
  const md5 = crypto.createHash("md5");
  return md5.update(str).digest('hex');


  let c = add(1,2);
  
}

function add(a, b) {
  return a + b;
}


/**
 * 生成密码
 * @param {*} raw 
 */
function generatePass(pass, raw = true) {
  pass = raw ? md5(pass) : pass;
  pass = pass.substr(1, 16);
  return md5(pass);
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
 * @param {*} rename
 */
async function saveFile(ctx, filePath, fieldNames, ops = {}, rename = false) {
  const options = Object.assign(ops, { headers: ctx.headers });
  const busboy = new Busboy(options);

  const { allowExts } = ops; //指定允许上传的文件类型
  if (!Array.isArray(fieldNames))
    fieldNames = [fieldNames];

  return new Promise((resolve, reject) => {
    const files = [];
    busboy.on('file', function (fieldName, file, fileName, encoding, mimetype) {
      let tooLarge = false;

      fileName = ops.rename ? `${generateGuid()}${path.extname(fileName)}`  : fileName;
      const absolutePath = path.join(filePath, fileName);
      const writeStream = fs.createWriteStream(absolutePath);
      
      file.on('data', (data) => writeStream.write(data));

      file.on('end', () => {
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

        files.push(Promise.resolve({ fieldName, fileName }));
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

function generateGuid() {
  return uuid.v4().replace(/\W/g, '');
}

/**
 * 校验整形参数
 */
function checkpara_int(param, min = 1, max) {
  if (!param) return true;
  if (isNaN(param)) return false;
  if (min && +param < min) return false;
  if (max && +param > max) return false;
  return true;
}

/**
 * 校验字符串参数
 */
function checkpara_str(param, min = 1, max) {
  if (!param) return true;
  param = param.toString();
  if (min && param.length < min) return false;
  if (max && param.length > max) return false;
  return true;
}

/**
 * 递归创建多级目录
 * @param {*} dir 
 */
function mkMultiDir(dir) {
  if (fs.existsSync(dir))
    return true;
  else {
    if (mkMultiDir(path.dirname(dir)))
      fs.mkdirSync(dir);
    return true
  }
}
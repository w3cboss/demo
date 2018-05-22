'use strict';

const multer = require('koa-multer');
const path = require('path');
const config = global.config;

if(!config.uploadOptions)
  throw new Error('缺少uploadOptions配置!');

function createMulter({ path: filePath, maxSize }){
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, filePath);
    },
    filename: function (req, file, cb) {
      const fileName = `${Date.now()}${path.extname(file.originalname)}`;
      cb(null, fileName);
    }
  });
  const upload = multer({
    storage: storage,
    limits: { fileSize: maxSize }
  });
  return upload;
}

module.exports.image = createMulter(config.uploadOptions.image);
module.exports.document = createMulter(config.uploadOptions.document);
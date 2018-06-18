'use strict';

const multer = require('koa-multer');
// const path = require('path');
const config = global.config;

function createMulter(){
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      
      cb(null, path);
    },
    filename: function (req, file, cb) {
      const fileName = `${filePrefix}${file.originalname}`;
      cb(null, fileName);
    }
  });
  const upload = multer({
    storage: storage,
    limits: { fileSize: 1 }
  });
  return upload;
}

module.exports = createMulter;
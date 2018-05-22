'use strict';

const Router = require('koa-router');
const multer = require('./multer');

const test = require('../controller/test');

const router = new Router();
router.all('/test/hi', test.hi);

router.post('/upload/image', multer.image.single('img'), ctx => {
  const f = ctx.req.file;
  ctx.endfor(0);
});

router.post('/upload/document', multer.document.single('doc'), ctx => {
  const f = ctx.req.file;
  ctx.endfor(0);
});

module.exports = router;
'use strict';

const Router = require('koa-router');
// const multer = require('./multer');

const test = require('../controller/test');
const admin = require('../controller/admin');
const post = require('../controller/post');

const router = new Router();
router.all('/test/hi', test.hi);
router.all('/admin/addlevel', admin.addLevel);

router.all('/post/getinfo', post.getInfo);

// router.post('/upload/image', (ctx, next) =>{
//   const f = ctx.request.file;
//   console.log('mid');
//   next();
// }, multer.image.single('img'), ctx => {
//   const f = ctx.req.file;
//   ctx.endfor(0);
// });

// router.post('/upload/document', multer.document.single('doc'), ctx => {
//   const f = ctx.req.file;
//   ctx.endfor(0);
// });

module.exports = router;
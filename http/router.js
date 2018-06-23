'use strict';

const Router = require('koa-router');
const multer = require('./multer');

const test = require('../controller/test');
const admin = require('../controller/admin');
const post = require('../controller/post');
const attach = require('../controller/attach');

const router = new Router();

router.all('/admin/getlevellist', admin.getLevelList);
router.all('/admin/addlevel', admin.addLevel);
router.all('/admin/updatelevel', admin.updateLevel);
router.all('/admin/getdeptlist', admin.getDeptList);
router.all('/admin/adddept', admin.addDept);
router.all('/admin/updatedept', admin.updateDept);
router.all('/admin/getuserpage', admin.getUserPage);
router.all('/admin/adduser', admin.addUser);
router.all('/admin/importusers', admin.importUsers);
router.all('/admin/updateuser', admin.updateUser);
router.all('/admin/getpostpage', admin.getPostPage);
router.all('/admin/updatepost', admin.updatePost);
router.all('/admin/getcrousellist', admin.getCarouselList);
router.all('/admin/addcarousel', admin.addCarousel);
router.all('/admin/updatecarousel', admin.updateCarousel);

router.all('/post/getinfo', post.getInfo);

router.post('/upload/document',  multer().single('file'), 
ctx => {
  const f = ctx.req.file;
  ctx.endfor(0);
});

router.all('/file/uploadattach', attach.uploadAttach);

module.exports = router;
'use strict';

const Router = require('koa-router');

const admin = require('../controller/admin');
const user = require('../controller/user');
const post = require('../controller/post');
const attach = require('../controller/attach');

const router = new Router();

router.all('/admin/get_levellist', admin.getLevelList);
router.all('/admin/add_level', admin.addLevel);
router.all('/admin/update_level', admin.updateLevel);
router.all('/admin/get_deptlist', admin.getDeptList);
router.all('/admin/add_dept', admin.addDept);
router.all('/admin/update_dept', admin.updateDept);
router.all('/admin/get_userpage', admin.getUserPage);
router.all('/admin/add_user', admin.addUser);
router.all('/admin/import_users', admin.importUsers);
router.all('/admin/update_user', admin.updateUser);
router.all('/admin/get_postpage', admin.getPostPage);
router.all('/admin/update_post', admin.updatePost);
router.all('/admin/get_carousellist', admin.getCarouselList);
router.all('/admin/get_carouselinfo', admin.getCarouselInfo);
router.all('/admin/add_carousel', admin.addCarousel);
router.all('/admin/update_carousel', admin.updateCarousel);

router.all('/user/login', user.login);
router.all('/user/change_pass', user.changePass);
router.all('/user/upload_img', user.uploadImg);
router.all('/user/set_avater', user.setAvater);
router.all('/user/get_info', user.getInfo);

router.all('/post/get_info', post.getInfo);
router.all('/post/get_page', post.getPage);
router.all('/post/publish', post.publish);
router.all('/post/delete', post.deletePost);
router.all('/post/get_detail', post.getDetail);
router.all('/post/get_replypage', post.getReplyPage);
router.all('/post/send_reply', post.sendReply);
router.all('/post/delete_reply', post.deleteReply);
router.all('/post/get_tippage', post.getTipPage);

router.all('/attach/get_info', attach.getInfo);
router.all('/attach/get_list', attach.getList);
router.all('/attach/upload', attach.uploadAttach);
router.all('/attach/download', attach.download);

module.exports = router;
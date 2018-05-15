'use strict';

const Router = require('koa-router');
const test = require('./controller/test.js');

const router = new Router();
router.all('/test/hi', test.hi);

module.exports = router;
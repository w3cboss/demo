'use-strict';

const koa = require('koa');
const body = require('koa-bodyparser');
const uuid = require('uuid');

const router = require('./router');
const config = global.config = require('./lib/config');
const logger = global.logger = require('./lib/logger');

const app = new koa();

app.use(body());

app.use((ctx, next) => {
  const __requestid = ctx.request.query.__requestid || ctx.request.body.__requestid ||
    uuid.v1().replace(/\W/g, '');

  const params = Object.assign({}, ctx.request.query, ctx.request.body);
  ctx.params = params;
  ctx.__requestid = __requestid;

  ctx.endfor = (code, msg, data) => {
    ctx.body = { code, msg, data, __requestid };
  };

  next();
});

app.use(router.routes());
app.listen(config.httpPort);
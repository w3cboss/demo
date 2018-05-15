'use-strict';

const koa = require('koa');
const body = require('koa-bodyparser');
const router = require('./router.js');
const config = require('./lib/config');

const app = new koa();

app.use(body());

app.use((ctx, next) => {
  const params = Object.assign({}, ctx.request.query, ctx.request.body);
  ctx.params = params;

  ctx.endfor = (code, msg, data) => {
    ctx.body = { code, msg, data };
  };

  next();
});

app.use(router.routes());
app.listen(config.httpPort);
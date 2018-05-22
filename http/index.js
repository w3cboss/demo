'use strict';

const Koa = require('koa');
const http = require('http');
const body = require('koa-bodyparser');
const staticServer = require('koa-static');
const multer = require('koa-multer');
const uuid = require('uuid');
const path = require('path');

const router = require('./router');

const logger = global.logger;
const config = global.config;

const app = new Koa();

app.use(body());

app.use(staticServer(`${path.resolve(__dirname, '..')}/www`));

app.use(async (ctx, next) => {
  const __requestid = ctx.request.query.__requestid || ctx.request.body.__requestid ||
    uuid.v1().replace(/\W/g, '');

  const params = Object.assign({}, ctx.request.query, ctx.request.body);
  ctx.params = params;
  ctx.__requestid = __requestid;

  ctx.endfor = (code, msg, data) => {
    ctx.body = { code, msg, data, __requestid };
  };

  await next();
});

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err){
    ctx.status = 500;
    ctx.body = err.message;
  }
});

app.use(router.routes());

app.init = new Promise((resolve, reject) => {
  app.httpServer = http.createServer(app.callback())
    .on('error', err => {
      logger.debug(`http server error, ${err.message}`);
      reject(err);
    })
    .on('listening', () => {
      logger.debug(`http server listening on ${config.httpPort}`);
      resolve();
    })
    .listen(config.httpPort);
});

module.exports = app;
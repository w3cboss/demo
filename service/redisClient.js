'use strict';

const ioredis = require('ioredis');

function createClient(url, readyResolve = defaultResolve, readyReject = defaultReject) {
  const client = Array.isArray(url) ? new ioredis(url) : new ioredis.Cluster(url);

  client.ready = new Promise(function (resolve, reject) {
    client.once('ready', () => {
      readyResolve();
      resolve();
    });

    client.once('error', err => {
      readyReject(err);
      reject();
    });
  });

  return client;
}

module.exports = createClient;

function defaultResolve() {
  console.log('redis connect success');
}

function defaultReject() {
  console.log(`redis connect error,${err.message}`);
}
'use strict';

const ioredis = require('ioredis');

function createClient(uri, options = {}) {
  const client = Array.isArray(uri) ? new ioredis.Cluster(uri, options) :  new ioredis(uri, options);

  client.connectSucceed = new Promise(function (resolve, reject) {
    client.once('ready', () => {
      resolve();
    });

    client.on('error', err => {
      reject(err);
    });
  });

  return client;
}

module.exports = createClient;
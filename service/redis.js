'use strict';

const ioredis = require('ioredis');

function createClient(uri) {
  const client = Array.isArray(uri) ? new ioredis(uri) : new ioredis.Cluster(uri);

  client.connectSucceed = new Promise(function (resolve, reject) {
    client.once('ready', () => {
      resolve();
    });

    client.once('error', err => {
      reject();
    });
  });

  return client;
}

module.exports = createClient;
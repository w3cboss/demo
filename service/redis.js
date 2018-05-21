'use strict';

const ioredis = require('ioredis');

function createClient(uri) {
  const client = Array.isArray(uri) ? new ioredis.Cluster(uri) :  new ioredis(uri);

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
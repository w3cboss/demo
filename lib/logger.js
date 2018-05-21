'use strict';

const winston = require('winston');
const daliyTransport = require('winston-daily-rotate-file');
const pack = require('../package.json');

const logger = new winston.Logger({
  transports: [
    new winston.transports.Console({ level: 'debug', colors: { debug: 'green' }}),
    new daliyTransport({
      dirname: global.config.logDir || process.platform == 'win32' ? `C:\\webos\\${pack.name}`
        : `/etc/webos/${pack.name}`,
      filename: 'log'
      // datePattern: 'YYYY-MM-DD',  //default
    })
  ],
});

module.exports = logger;
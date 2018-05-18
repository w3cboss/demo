'use strict';

const { Logger, transports } = require('winston');
const daliyTransport = require('winston-daily-rotate-file');
const pack = require('../package.json');

const logger = new Logger({
  transports: [
    new transports.Console(),
    new daliyTransport({
      dirname: global.config.logDir || process.platform == 'win32' ? `C:\\webos\\${pack.name}`
        : `/etc/webos/${pack.name}`,
      filename: 'log'
      // datePattern: 'YYYY-MMDD',  //default
    })
  ]
});

module.exports = logger;
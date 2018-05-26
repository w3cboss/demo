'use strict';

const pack = require('../package.json');
const log4js = require('log4js');

log4js.configure({
  appenders: {
    date: {
      type: 'dateFile',
      filename: global.config.logDir || process.platform == 'win32' ? `C:\\webos\\${pack.name}\\`
      : `/etc/webos/${pack.name}/`,
      pattern: 'yyyy-MM-dd',
      alwaysIncludePattern: true
    },
    console: {
      type: 'console'
    }
  },
  categories: {
    default: {
      appenders: ['date', 'console'],
      level: 'all'
    }
  }
});

module.exports = log4js.getLogger('default');
'use strict';

const pack = require('./package.json');
const rootDir = process.platform === 'win32' ? `C:\\webconfig\\${pack.name}` 
  : `/etc/webconfig/${pack.name}`;

module.exports = require(rootDir);
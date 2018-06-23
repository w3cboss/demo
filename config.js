'use strict';

const pack = require('./package.json');
const isWindows = process.platform === 'win32';
const rootDir = isWindows ? `C:\\webconfig\\${pack.name}` 
  : `/etc/webconfig/${pack.name}`;

const config = require(rootDir);
config.isWindows = isWindows;

module.exports = config;
'use strict';

const pack = require('../package.json');
const rootDir = process.platform === 'win32' ? `C:\\${pack.name}` : `/etc/${pack.name}`;

global.config = require(rootDir);

module.exports = global.config;
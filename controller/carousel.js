const Sequelize = require('sequelize');
const lodash = require('lodash');

const mysql = require('../lib/mysql');
const tools = require('../lib/tools')

const ET = require('../ET');

const { User, Carousel, Post } = mysql.models;
const logger = global.logger;
const { cookieKey } = global.config;

module.exports = {};


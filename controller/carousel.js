const Sequelize = require('sequelize');
const lodash = require('lodash');

const mysql = require('../lib/mysql');
const tools = require('../lib/tools')

const { User, Carousel, Post } = mysql.models;
const logger = global.logger;
const { cookieKey } = global.config;

module.exports = {  };

/**
 * 
 * @param {*} param0 
 */
async function getList({ params, endfor }) {
    const carousels = await Carousel.findAll({
      attributes: ['Id', 'Title', 'Rank', 'Url', 'post.id', 
        'post.title', ''],
      where: { State: 0 },
      order: [['Rank', 'ASC']],
      include: { model: Post },
      raw: true
    }).catch(err => logger.error(`Carousel_getList失败,${err.message}`));

    if (!carousels) return endfor(40);


}

async function add({ params, endfor }) {

}
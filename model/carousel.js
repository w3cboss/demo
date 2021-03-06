'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define("Carousel",
    {
      Id: {
        type: DataTypes.INTEGER,
        field: 'id',
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      PostId: {
        type: DataTypes.INTEGER,
        field: 'post_id',
        allowNull: false,
        comment: '',
        references: {
          model: 'post',
          key: 'id'
        }
      },
      UserId: {
        type: DataTypes.INTEGER,
        field: 'user_id',
        allowNull: false,
        comment: '',
        references: {
          model: 'user',
          key: 'id'
        }
      },
      Title: {
        type: DataTypes.STRING(64),
        field: 'title',
        allowNull: false,
        comment: ''
      },
      Url: {
        type: DataTypes.STRING(128),
        field: 'url',
        allowNull: false,
        comment: ''
      },
      Rank: {
        type: DataTypes.TINYINT,
        field: 'rank',
        allowNull: false,
        defaultValue: 1,
        comment: ''
      },
      State: {
        type: DataTypes.TINYINT,
        field: 'state',
        allowNull: false,
        defaultValue: 0,
        comment: ''
      }
    },
    {
      freezeTableName: true,
      tableName: 'carousel',
      createdAt: 'create_time',
      updatedAt: 'last_time',
      comment: '轮播图'
    }
  );
}
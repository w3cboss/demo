'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define("Post",
    {
      Id: {
        type: DataTypes.INTEGER,
        field: 'id',
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      Title: {
        type: DataTypes.STRING(128),
        field: 'title',
        allowNull: false,
        comment: ''
      },
      UserId: {
        type: DataTypes.INTEGER,
        field: 'user_id',
        allowNull: false,
        comment: ''
      },
      LevelId: {
        type: DataTypes.TINYINT,
        field: 'level_id',
        comment: '可见等级'
      },
      Content: {
        type: DataTypes.TEXT,
        field: 'content',
        comment: ''
      }
    },
    {
      freezeTableName: true,
      tableName: 'post',
      createdAt: 'create_time',
      updatedAt: 'last_time',
      comment: ''
    }
  );
}
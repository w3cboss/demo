'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define("Attach",
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
      Name: {
        type: DataTypes.STRING(64),
        field: 'name',
        allowNull: false,
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
      tableName: 'attachment',
      createdAt: 'create_time',
      updatedAt: 'last_time',
      comment: '帖子附件'
    }
  );
}
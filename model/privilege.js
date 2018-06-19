'use strict';

module.exports = function (sequelize, DataTypes) {
  const Privilege = sequelize.define("Privilege",
    {
      Id: {
        type: DataTypes.INTEGER,
        field: 'id',
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
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
      Type: {
        type: DataTypes.TINYINT,
        field: 'type',
        allowNull: false,
        comment: ''
      }
    },
    {
      freezeTableName: true,
      tableName: 'privilege',
      createdAt: 'create_time',
      updatedAt: 'last_time',
      comment: '用户特殊权限'
    }
  );

  Privilege.ETYPE = {
    超级管理员: 1,
    发布轮播图: 2,
    管理帖子: 3,
  }
}
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
        type: DataTypes.INT,
        field: 'user_id',
        allowNull: false,
        comment: ''
      },
      Privilege: {
        type: DataTypes.TINYINT,
        field: 'privilege',
        allowNull: false,
        comment: ''
      }
    },
    {
      freezeTableName: true,
      tableName: 'privilege',
      createdAt: 'create_time',
      updatedAt: 'last_time',
      comment: ''
    }
  );

  Privilege.ETYPE = {
    发布轮播图 = 1
  }
}
'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define("User",
    {
      Id: {
        type: DataTypes.INTEGER,
        field: 'id',
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      Number: {
        type: DataTypes.STRING(32),
        field: 'number',
        allowNull: false,
        comment: ''
      },
      Name: {
        type: DataTypes.STRING(16),
        field: 'name',
        allowNull: false,
        comment: ''
      },
      Pass: {
        type: DataTypes.STRING(32),
        field: 'pass',
        allowNull: false,
        comment: ''
      },
      Key: {
        type: DataTypes.STRING(48),
        field: 'key',
        allowNull: false,
        comment: ''
      },
      Avater: {
        type: DataTypes.STRING(128),
        field: 'avater',
        comment: ''
      },
      DeptId: {
        type: DataTypes.TINYINT,
        field: 'department_id',
        allowNull: false,
        comment: ''
      },
      State: {
        type: DataTypes.TINYINT,
        field: 'state',
        allowNull: false,
        defaultValue: 0,
        comment: ''
      },
      IsAdmin: {
        type: DataTypes.TINYINT,
        field: 'is_admin',
        allowNull: false,
        defaultValue: 0,
        comment: ''      
      }
    },
    {
      freezeTableName: true,
      tableName: 'user',
      createdAt: 'create_time',
      updatedAt: 'last_time',
      comment: '用户'
    }
  );
}
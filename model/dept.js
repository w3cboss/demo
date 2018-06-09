'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define("Dept",
    {
      Id: {
        type: DataTypes.INTEGER,
        field: 'id',
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      Name: {
        type: DataTypes.STRING(16),
        field: 'name',
        allowNull: false,
        comment: ''
      },
      LevelId: {
        type: DataTypes.INTEGER,
        field: 'level_id',
        allowNull: false,
        comment: '',
        references: {
          model: 'level',
          key: 'id'
        }
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
      tableName: 'department',
      createdAt: 'create_time',
      updatedAt: 'last_time',
      comment: '部门'
    }
  );
}
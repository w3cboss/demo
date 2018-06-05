'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define("Level",
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
      Rank: {
        type: DataTypes.TINYINT,
        field: 'rank',
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
      tableName: 'level',
      createdAt: 'create_time',
      updatedAt: 'last_time',
      comment: ''
    }
  );
}
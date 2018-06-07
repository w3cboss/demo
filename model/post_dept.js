'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define("PostDept",
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
        comment: ''
      },
      DeptId: {
        type: DataTypes.INTEGER,
        field: 'dept_id',
        allowNull: false,
        comment: ''
      },
    },
    {
      freezeTableName: true,
      tableName: 'post_dept',
      createdAt: 'create_time',
      updatedAt: 'last_time',
      comment: ''
    }
  );
}
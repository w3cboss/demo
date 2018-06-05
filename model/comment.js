'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define("Comment",
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
      UserId: {
        type: DataTypes.INTEGER,
        field: 'user_id',
        allowNull: false,
        comment: ''
      },
      Content: {
        type: DataTypes.STRING(512),
        field: 'content',
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
      tableName: 'comment',
      createdAt: 'create_time',
      updatedAt: 'last_time',
      comment: ''
    }
  );
}
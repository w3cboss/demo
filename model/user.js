//const mysql = require('../lib/mysql');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define("user",
    {
      Id: {
        type: DataTypes.INTEGER,
        field: 'UAV_PKID',
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      Guid: {
        type: DataTypes.STRING,
        field: 'UAV_GUID',
        allowNull: false,
        unique: true,
        comment: '邮件链接参数'
      }
    },
    {
      freezeTableName: true,
      tableName: 'user_test',
      timestamps: false,
      comment: 'test'
    }
  );
}
'use strict';

module.exports = function (sequelize, DataTypes) {
  const Tip = sequelize.define("Tip",
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
          model: 'post',
          key: 'id'
        }
      },
      ReplyUserId: {
        type: DataTypes.INTEGER,
        field: 'reply_user_id',
        allowNull: false,
        comment: '',
        references: {
          model: 'post',
          key: 'id'
        }
      },
      ReplyId: {
        type: DataTypes.INTEGER,
        field: 'reply_id1',
        comment: '回复id',
        references: {
          model: 'reply',
          key: 'id'
        }
      },
      State: {
        type: DataTypes.TINYINT,
        field: 'state',
        allowNull: false,
        defaultValue: 0,
        comment: '是否已读'
      },
    },
    {
      freezeTableName: true,
      tableName: 'tip',
      createdAt: 'create_time',
      updatedAt: 'last_time',
      comment: '回复提示'
    }
  );

  return Tip;
}
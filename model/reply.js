'use strict';

module.exports = function (sequelize, DataTypes) {
  const Reply = sequelize.define("Reply",
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
      ReplyId1: {
        type: DataTypes.INTEGER,
        field: 'reply_id1',
        comment: '一级回复id',
        references: {
          model: 'reply',
          key: 'id'
        }
      },
      ReplyId2: {
        type: DataTypes.INTEGER,
        field: 'reply_id2',
        comment: '二级回复id',
        references: {
          model: 'reply',
          key: 'id'
        }
      },
      Content: {
        type: DataTypes.STRING(1024),
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
      tableName: 'reply',
      createdAt: 'create_time',
      updatedAt: 'last_time',
      comment: '帖子回复'
    }
  );

  Reply.ETYPE = {
    一级回复: 1,
    二级回复: 2,
    三级回复: 3
  }

  return Reply;
}
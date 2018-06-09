'use strict';

module.exports = function (sequelize, DataTypes) {
  const Post = sequelize.define("Post",
    {
      Id: {
        type: DataTypes.INTEGER,
        field: 'id',
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      Title: {
        type: DataTypes.STRING(128),
        field: 'title',
        allowNull: false,
        comment: ''
      },
      UserId: {
        type: DataTypes.INTEGER,
        field: 'user_id',
        allowNull: false,
        comment: '外键',
        // references: {
        //   model: 'user',
        //   key: 'id'
        // }
      },
      // LevelId: {
      //   type: DataTypes.TINYINT,
      //   field: 'level_id',
      //   comment: '可见等级'
      // },
      IsPublic: {
        type: DataTypes.TINYINT,
        field: 'is_public',
        comment: '是否公开可见',
        allowNull: false,
        defaultValue: 1
      },
      IsAllowAttach: {
        type: DataTypes.TINYINT,
        field: 'is_allowattach',
        comment: '是否允许上传附件',
        allowNull: false,
        defaultValue: 0
      },
      Content: {
        type: DataTypes.TEXT,
        field: 'content',
        allowNull: false,
        comment: ''
      },
      Count: {
        type: DataTypes.INTEGER,
        field: 'count',
        comment: '浏览次数',
        allowNull: false,
        defaultValue: 0
      },
      State: {
        type: DataTypes.TINYINT,
        field: 'state',
        allowNull: false,
        comment: ''
      }
    },
    {
      freezeTableName: true,
      tableName: 'post',
      createdAt: 'create_time',
      updatedAt: 'last_time',
      comment: '帖子'
    }
  );

  Post.ESTATE = {
    启用: 0,
    草稿: 1,
    删除: 2
  };

  return Post;
}
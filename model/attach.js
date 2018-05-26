module.exports = function (sequelize, DataTypes) {
  return sequelize.define("Attach",
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
      Url: {
        type: DataTypes.STRING(128),
        field: 'url',
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
      tableName: 'attachment',
      createdAt: 'create_time',
      updatedAt: 'last_time',
      comment: ''
    }
  );
}
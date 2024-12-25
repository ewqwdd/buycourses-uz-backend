const { DataTypes } = require("sequelize");
const { sequelize } = require("../sequelize/sequelize");

const User = sequelize.define(
  "User",
  {
    email: {
      unique: true,
      type: DataTypes.STRING,
    },
    password: {
      allowNull: true,
      type: DataTypes.STRING,
    },
    emailLink: {
      allowNull: true,
      type: DataTypes.STRING,
    },
    balance: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    createdAt: true,
  }
);

module.exports = { User };
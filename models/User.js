const { DataTypes } = require("sequelize");
const { sequelize } = require("../sequelize/sequelize");
const { Product } = require("./Product");
const { Transaction } = require("./Transaction");

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
    role: {
      type: DataTypes.ENUM("admin", "user"),
      defaultValue: "user",
    }
  },
  {
    createdAt: true,
  }
);

module.exports = { User };
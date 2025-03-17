const { DataTypes } = require("sequelize");
const { sequelize } = require("../sequelize/sequelize");

const APayTranssaction = sequelize.define(
  "APayTranssaction",
  {
    type: {
      type: DataTypes.ENUM("deposit", "withdrawal"),
    },
    amount: {
      type: DataTypes.INTEGER,
    },
    status: {
      type: DataTypes.ENUM("pending", "completed", "cancelled"),
    },
    orderId: {
      type: DataTypes.STRING,
      unique: true,
    },
    returnUrl: {
      type: DataTypes.STRING,
    },
  },
  {
    createdAt: true,
  },
);

module.exports = { APayTranssaction };

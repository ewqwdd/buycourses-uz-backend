const { DataTypes } = require("sequelize");
const { sequelize } = require("../sequelize/sequelize");

const Transaction = sequelize.define(
  "Transaction",
  {
    type: {
      type: DataTypes.ENUM("deposit", "withdrawal", "buy", "sell"),
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
  },
  {
    createdAt: true,
  },
);

module.exports = { Transaction };

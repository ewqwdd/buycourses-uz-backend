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
  },
  {
    createdAt: true,
  }
);

module.exports = { Transaction };

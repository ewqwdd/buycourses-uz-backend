const { DataTypes } = require("sequelize");
const { sequelize } = require("../sequelize/sequelize");

const Withdraw = sequelize.define(
  "Withdraw",
  {
    status: {
      type: DataTypes.ENUM("pending", "completed", "cancelled"),
    },
    amount: {
      type: DataTypes.INTEGER,
    },
    date: {
      type: DataTypes.DATE,
    },
    cardNumber: {
      type: DataTypes.STRING,
    },
  },
  {
    createdAt: true,
  }
);

module.exports = { Withdraw };

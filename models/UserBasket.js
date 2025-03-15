const { sequelize } = require("../sequelize/sequelize");
const { DataTypes } = require("sequelize");

const UserBasket = sequelize.define("UserBasket", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Users",
      key: "id",
    },
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Products",
      key: "id",
    },
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
});

module.exports = { UserBasket };

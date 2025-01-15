const { sequelize } = require("../sequelize/sequelize");
const { Sequelize, DataTypes } = require("sequelize");

const UserProducts = sequelize.define("UserProducts", {
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
});

module.exports = { UserProducts };

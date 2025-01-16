const { DataTypes } = require("sequelize");
const { sequelize } = require("../sequelize/sequelize");

const Product = sequelize.define(
  "Product",
  {
    name: {
      type: DataTypes.STRING,
    },
    slug: {
      type: DataTypes.STRING,
    },
    content: {
      type: DataTypes.TEXT,
    },
    price: {
      type: DataTypes.FLOAT,
    },
  },
  {
    createdAt: true,
  }
);

module.exports = { Product };

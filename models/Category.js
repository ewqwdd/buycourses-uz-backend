const { DataTypes } = require("sequelize");
const { sequelize } = require("../sequelize/sequelize");

const Category = sequelize.define(
  "Category",
  {
    name: {
      unique: true,
      type: DataTypes.STRING,
    },
    slug: {
      unique: true,
      type: DataTypes.STRING,
    },
    img: {
      type: DataTypes.STRING,
    },
  },
  {
    createdAt: true,
  }
);

module.exports = { Category };

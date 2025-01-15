const { DataTypes } = require("sequelize");
const { sequelize } = require("../sequelize/sequelize");

const Material = sequelize.define(
  "Material",
  {
    name: {
      type: DataTypes.STRING,
    },
    url: {
      type: DataTypes.STRING,
    },
  },
  {
    createdAt: true,
  }
);

module.exports = { Material };

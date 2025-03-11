const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    logging: false,
    port: process.env.DB_PORT,
  },
);

async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log("Connection to MySQL established successfully.");

    // Синхронизация базы данных
    await sequelize.sync({ alter: true }); // Используем `alter` для автоматической корректировки таблицы
    console.log("Database synchronized successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}

module.exports = { sequelize, initializeDatabase };

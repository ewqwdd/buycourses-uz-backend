const express = require("express");
const cors = require("cors");
const { initializeDatabase } = require("./sequelize/sequelize");
const app = express();
require("dotenv").config();

app.use(cors());

initializeDatabase();

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

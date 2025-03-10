const moment = require("moment");
require("dotenv").config();
const axios = require("axios");
const crypto = require("crypto");

function generateAuthHeader(merchantUserId, secretKey) {
  const timestamp = Math.floor(Date.now() / 1000); // 10-значный UNIX timestamp
  const digest = crypto
    .createHash("sha1")
    .update(`${timestamp}${secretKey}`)
    .digest("hex");
  return `Auth: ${merchantUserId}:${digest}:${timestamp}`;
}

const createDeposit = async (id, amount, userId) => {
  try {
    const header = generateAuthHeader(
      process.env.CLICK_USER_ID,
      process.env.CLICK_SECRET_KEY,
    );
    const body = {};
    const { data } = await axios.post(
      `${process.env.CLICK_API}/prepare_payment`,
      body,
    );
    console.log(data);
    return data;
  } catch (error) {
    console.error("error while creating deposit:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

module.exports = { createDeposit };

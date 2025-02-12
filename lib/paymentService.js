const moment = require("moment");
require("dotenv").config();
const axios = require("axios");

const createDeposit = async (id, amount, userId) => {
  try {
    const body = {
      merchant_shop_id: process.env.MERCHANT_ID,
      merchant_secret: process.env.MERCHANT_SECRET,
      shop_transaction_id: id,
      test: false,
      init_time: moment().format("YYYY-MM-DD HH:mm:ss"),
      total_sum: amount,
      currency: "UZS",
      description: "Пополнение баланса",
      return_url: `${process.env.APP_URL}/deposit/confirmation?id=${id}`,
      user_id: userId,
      notify_url: `${process.env.BASE_URL}/deposit/notify`,
      auto_capture: true,
      payment_methods: [
        {
          method: "humo",
        },
        {
          method: "uzcard",
        },
      ],
    };
    const { data } = await axios.post(
      `${process.env.MERCHANT_URL}/prepare_payment`,
      body
    );
    console.log(data);
    return data;
  } catch (error) {
    console.error("error while creating deposit:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

module.exports = { createDeposit };

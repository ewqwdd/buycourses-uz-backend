const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { Transaction } = require("../models");
const { generateOrderId } = require("../lib/generateOrderId");
require("dotenv").config();

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    const id = req.user.id;
    const orderId = generateOrderId();
    const transaction = await Transaction.create({
      userId: id,
      amount,
      type: "deposit",
      status: "pending",
      orderId,
    });

    const payUrl =
      process.env.CLICK_API +
      `/services/pay?service_id=${process.env.CLICK_SERVICE_ID}` +
      `&merchant_id=${process.env.CLICK_MERCHANT_ID}` +
      `&amount=${amount}` +
      `&transaction_param=${orderId}` +
      `&return_url=${process.env.BASE_URL + "/notify"}`;

    return res.json({
      url: payUrl,
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

module.exports = router;

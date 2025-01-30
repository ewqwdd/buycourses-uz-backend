const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { Transaction, User } = require("../models");
const { createDeposit } = require("../lib/paymentService");
const { default: axios } = require("axios");
require("dotenv").config();

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    const id = req.user.id;
    const transaction = await Transaction.create({
      userId: id,
      amount,
      type: "deposit",
      status: "pending",
    });
    const deposit = await createDeposit(transaction.dataValues.id, amount * 1.01, id);

    if (deposit?.pay_url) {
      return res.json({ url: deposit.pay_url });
    }

    return res.status(400).json({ success: false });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

router.post("/notify", async (req, res) => {
  try {
    const { shop_transaction_id, status } = req.body;
    console.log(req.body);
    if (!shop_transaction_id || !status) {
      return res.status(200).send("OK");
    }
    const transaction = await Transaction.findByPk(Number(shop_transaction_id));
    if (transaction && status === "succeeded") {
      transaction.status = "completed";
      if (transaction.type === "deposit") {
        const user = await User.findByPk(transaction.userId);
        user.balance += transaction.amount;
        await user.save();
      }
      await transaction.save();
    }

    return res.status(200).send("OK");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

router.post("/callback/anor", async (req, res) => {
  try {
    const body = req.body;

    const { data } = await axios.post(
      `${process.env.PAY_CRM_URL}/Remotes/callback-anor-deposit`,
      body
    );
    console.log("PAY CRM RESPOSNSE:\n", data);
    return res.status(200).send("OK");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

module.exports = router;

const { default: axios } = require("axios");
const express = require("express");
const { APayTranssaction } = require("../models/APayTranssaction");
const { createDepositKhati } = require("../lib/paymentService");

require("dotenv").config();

const router = express.Router();

router.post("/a/callback-deposit-khalti", async (req, res) => {
  try {
    const { data } = req.body;
    console.log(data);
    await axios
      .post("https://pay-crm.com/payment/callback-khalti-deposit", data)
      .then((response) => {
        console.log(response);
      });
    res.status(200).send("OK");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/a/callback-withdrawal-khalti", async (req, res) => {
  try {
    const { data } = req.body;
    console.log(data);
    await axios
      .post("https://pay-crm.com/payment/callback-khalti-withdrawal", data)
      .then((response) => {
        console.log(response);
      });
    res.status(200).send("OK");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/deposit-khalti", async (req, res) => {
  const { order_id, amount, return_url } = req.query;
  try {

    if (!order_id || !amount || !return_url) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const found = await APayTranssaction.findOne({
      where: {
        orderId: order_id,
      },
    });

    if (found && found.oaymentUrl) {
      return res.redirect(found.oaymentUrl);
    }
    
    const transaction = await APayTranssaction.create({
      amount,
      type: "deposit",
      status: "pending",
      orderId: order_id,
      returnUrl: return_url,
    });

    const deposit = await createDepositKhati(order_id, amount, "Deposit");

    if (deposit?.payment_url) {
      transaction.paymentUrl = deposit.payment_url;
      await transaction.save();
      return res.redirect(deposit.payment_url);
    }

    return res.status(400).json({ success: false });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

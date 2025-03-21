const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { Transaction, User } = require("../models");
const {
  createDeposit,
  createDepositKhati,
  createDepositEsewa,
} = require("../lib/paymentService");
const { default: axios } = require("axios");
const { generateOrderId } = require("../lib/generateOrderId");
const { AxiosError } = require("axios");
const { APayTranssaction } = require("../models/APayTranssaction");
require("dotenv").config();

const router = express.Router();

router.post("/khati", authMiddleware, async (req, res) => {
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
    const user = await User.findByPk(id);
    const deposit = await createDepositKhati(orderId, amount, "Deposit", user);

    if (deposit?.payment_url) {
      return res.json({ url: deposit.payment_url });
    }

    return res.status(400).json({ success: false });
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error(error.response.data);
    } else {
      console.error("Unable to connect to the database:", error);
    }
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/esewa", authMiddleware, async (req, res) => {
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
    const user = await User.findByPk(id);
    const deposit = await createDepositEsewa(orderId, amount * 1.01);
    console.log(deposit);

    if (deposit?.payment_url) {
      return res.json({ url: deposit.payment_url });
    }

    return res.status(400).json({ success: false });
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error(error.response.data);
    } else {
      console.error("Unable to connect to the database:", error);
    }
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/notify", async (req, res) => {
  try {
    const { shop_transaction_id, status } = req.body;
    console.log(req.body);
    if (!shop_transaction_id || !status) {
      return res.status(200).send("OK");
    }
    const transaction = await Transaction.findOne({
      where: { orderId: shop_transaction_id },
    });
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
    res.status(500).json({ message: "Server error" });
  }
});

router.get('/status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id)
    const { data } = await axios.post(
        `${process.env.KHATI_API}/epayment/lookup/`,
        {
          pidx: id,
        },
        {
          headers: {
            Authorization: `key ${process.env.KHATI_KEY}`,
          },
        },
      );

      return res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json(error.response.data);
  }
});

router.get("/khati/notify", async (req, res) => {
  try {
    const { purchase_order_id, status, pidx } = req.query;
    if (!purchase_order_id) {
      return res.status(200).send("OK");
    }
    const transaction = await Transaction.findOne({
      where: { orderId: purchase_order_id },
    });

    if (transaction) {
      if (status === "Completed") {
        transaction.status = "completed";
        if (transaction.type === "deposit") {
          const user = await User.findByPk(transaction.userId);
          user.balance += transaction.amount;
          await user.save();
        }
        await transaction.save();
      }

      return res
        .status(200)
        .redirect(
          `${process.env.APP_URL}/deposit/confirmation?id=${transaction.id}`,
        );
    }

    const aPayTransaction = await APayTranssaction.findOne({
      where: { orderId: purchase_order_id },
    });
    if (aPayTransaction) {
      if (status === "Completed") {
        aPayTransaction.status = "completed";
        aPayTransaction.pidx = pidx;
        await aPayTransaction.save();
      }

      console.log('khalti: ', req.query);

      await axios
        .post(process.env.KHALTI_CALLBACK_DEPOSIT, req.query)
        .then((response) => {
          console.log(response);
        })
        .catch((err) => console.log(err));

      return res
        .status(200)
        .redirect(
          `${process.env.APP_URL}/deposit/a/confirmation?id=${aPayTransaction.id}`,
        );
    }
    return res.redirect(process.env.APP_URL + "/404");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

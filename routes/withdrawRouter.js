const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { Withdraw } = require("../models/Withdraw");
const maskCard = require("../lib/maskCard");
require("dotenv").config();

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const id = req.user.id;
    const data = await Withdraw.findAll({ where: { userId: id } });
    const masked = data.map((item) => ({...item.dataValues, cardNumber: maskCard(item.cardNumber)}));
    res.json(masked);
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { amount, cardNumber } = req.body;
    const userId = req.user.id;
    const withdraw = await Withdraw.create({
      amount,
      userId,
      status: "pending",
      date: new Date(),
      cardNumber
    });
    res.json(withdraw);
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

module.exports = router;
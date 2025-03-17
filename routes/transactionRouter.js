const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { Transaction } = require("../models");
const { APayTranssaction } = require("../models/APayTranssaction");

const router = express.Router();

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const transaction = await Transaction.findOne({
      where: { id: req.params.id, userId },
    });

    if (transaction) {
      return res.json(transaction);
    }

    return res.status(404).json({ message: "Транзакция не найдена" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/a/:id", async (req, res) => {
  try {
    const transaction = await APayTranssaction.findOne({
      where: { id: req.params.id },
    });
    console.log(transaction);

    if (transaction) {
      res.json(transaction);
      return;
    }

    return res.status(404).json({ message: "Транзакция не найдена" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

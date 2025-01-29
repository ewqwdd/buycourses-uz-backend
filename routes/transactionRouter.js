const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { Transaction } = require("../models");

const router = express.Router();

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const transaction = await Transaction.findOne({
        where: { id: req.params.id, userId },
    });
    if (!transaction) {
      return res.status(404).json({ message: "Транзакция не найдена" });
    }
    res.json(transaction);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

module.exports = router;

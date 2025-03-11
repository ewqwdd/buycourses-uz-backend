const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { Transaction, User } = require("../models");
const { createDeposit } = require("../lib/paymentService");
const { default: axios } = require("axios");
const { generateOrderId } = require("../lib/generateOrderId");
require("dotenv").config();
const crypto = require('crypto');
const { sendMessageToChannel } = require("../lib/telegramLogger");


function md5(input) {
  return crypto.createHash('md5').update(input).digest('hex');
}

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
    sendMessageToChannel(`/deposit \`\`\`
${JSON.stringify(transaction, null, 2)}
\`\`\``)

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

router.get("/notify", async (req, res) => {
  sendMessageToChannel(`/notify GET\n\`\`\`
${JSON.stringify(req.query, null, 2)}
\`\`\``)
  console.log(req.query);
  console.log("GET");
  return res.status(200).send("OK");
});

router.post("/notify", async (req, res) => {
  try {
    console.log(req.body);
    // if (!shop_transaction_id || !status) {
    //   return res.status(200).send("OK");
    // }
    // const transaction = await Transaction.findOne({
    //   where: { orderId: shop_transaction_id },
    // });
    // if (transaction && status === "succeeded") {
    //   transaction.status = "completed";
    //   if (transaction.type === "deposit") {
    //     const user = await User.findByPk(transaction.userId);
    //     user.balance += transaction.amount;
    //     await user.save();
    //   }
    //   await transaction.save();
    // }

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
      body,
    );
    console.log("PAY CRM RESPOSNSE:\n", data);
    return res.status(200).send("OK");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

router.post('/click/prepare', async (req, res) => {
  try {
  const { click_trans_id, merchant_trans_id, amount, action, sign_time, sign_string, service_id } = req.body;
  sendMessageToChannel(`prepare:\n
\`\`\`
${JSON.stringify(req.body, null, 2)}
\`\`\``)

  // Формируем контрольную строку
  const secretKey = process.env.CLICK_SECRET_KEY;
  const expectedSign = md5(`${click_trans_id}${service_id}${secretKey}${merchant_trans_id}${amount}${action}${sign_time}`);

  sendMessageToChannel(` \`\`\`
${JSON.stringify({expectedSign, sign_string}, null, 2)}
\`\`\``)

  if (sign_string !== expectedSign) {
      return res.json({ error: -1, error_note: "Invalid signature" });
  }

  sendMessageToChannel(` \`\`\`
${JSON.stringify({merchant_trans_id}, null, 2)}
\`\`\``)

  // Проверяем, существует ли заказ
  const order = await Transaction.findOne({ where: { orderId: merchant_trans_id } });
  sendMessageToChannel(` \`\`\`
${JSON.stringify({order, amount}, null, 2)}
\`\`\``)

  // if (!order || order.amount !== amount) {
  //     return res.json({ error: -9, error_note: "Invalid order or amount" });
  // }

  // Генерируем merchant_prepare_id и сохраняем в базе
  const merchant_prepare_id = crypto.randomUUID();
  order.prepareId= merchant_prepare_id;
  await order.save();

  res.json({
      click_trans_id,
      merchant_trans_id,
      merchant_prepare_id,
      error: 0,
      error_note: "Success"
  });
} catch (error) {
  console.error(error);
  res.status(500).json({ message: "Ошибка сервера" });
}
});

router.post('/click/complete', async (req, res) => {
  try {
  const { click_trans_id, merchant_trans_id, merchant_prepare_id, amount, action, sign_time, sign_string,service_id } = req.body;
  sendMessageToChannel(`complete:\n
\`\`\`
${JSON.stringify(req.body, null, 2)}
\`\`\``)
  // Проверяем подпись
  const expectedSign = md5(`${click_trans_id}${service_id}${SECRET_KEY}${merchant_trans_id}${merchant_prepare_id}${amount}${action}${sign_time}`);
  sendMessageToChannel(` \`\`\`
${JSON.stringify({expectedSign, sign_string}, null, 2)}
\`\`\``)

  if (sign_string !== expectedSign) {
      return res.json({ error: -1, error_note: "Invalid signature" });
  }

  // Проверяем, подтвержден ли заказ
  const transaction = await Transaction.findOne({ where: { prepareId: merchant_prepare_id } });
  sendMessageToChannel(` \`\`\`
${JSON.stringify(transaction, null, 2)}
\`\`\``)
  if (!transaction) {
      return res.json({ error: -9, error_note: "Prepare not found" });
  }

  transaction.status = "completed";
      if (transaction.type === "deposit") {
        const user = await User.findByPk(transaction.userId);
        user.balance += transaction.amount;
        await user.save();
      }
      await transaction.save();

  res.json({
      click_trans_id,
      merchant_trans_id,
      merchant_confirm_id: generateConfirmId(),
      error: 0,
      error_note: "Payment confirmed"
  });
} catch (error) {
  console.error(error);
  res.status(500).json({ message: "Ошибка сервера" });
}
});

module.exports = router;

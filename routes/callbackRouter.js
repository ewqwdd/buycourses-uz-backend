const { default: axios } = require("axios");
const express = require("express");

require("dotenv").config();

const router = express.Router();

router.post("/callback-deposit-khalti", async (req, res) => {
  try {
    const { data } = req.body;
    console.log(data);
    await axios.post(
      "https://pay-crm.com/payment/callback-khalti-deposit",
      data
    ).then((response) => {
        console.log(response);
    });;
    res.status(200).send("OK");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/callback-withdrawal-khalti", async (req, res) => {
  try {
    const { data } = req.body;
    console.log(data);
    await axios.post(
      "https://pay-crm.com/payment/callback-khalti-withdrawal",
      data
    ).then((response) => {
        console.log(response);
    });
    res.status(200).send("OK");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/deposit", async (req, res) => {
  const {
    order_id,
    payment_system,
    amount,
    currency,
    custom_user_id,
    custom_transaction_id,
    data,
  } = req.body;
  try {
    const deposit = await axios.post(
      "https://khalti.com/api/v2/epayment/initiate",
      {
        amount,
        return_url: `${process.env.BASE_URL}/callback-deposit-khalti`,
        website_url: `${process.env.APP_URL}`,
        purchase_order_id: order_id,
        purchase_order_name: custom_transaction_id,
      }
    ).then((response) => {
        console.log(response);
    });
    return res.json({ message: "Success", data });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
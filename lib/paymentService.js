require("dotenv").config();
const axios = require("axios");
const crypto = require("crypto");

const createDepositKhati = async (id, amount, name) => {
  const body = {
    website_url: process.env.APP_URL,
    return_url: `${process.env.BASE_URL}/deposit/khati/notify`,
    purchase_order_id: id,
    purchase_order_name: name,
    amount: Math.floor(amount) * 100,
  };
  const { data } = await axios.post(
    `${process.env.KHATI_API}/epayment/initiate/`,
    body,
    {
      headers: {
        Authorization: `key ${process.env.KHATI_KEY}`,
      },
    },
  );
  console.log(data);
  return data;
};

function generateSignature(message, secret) {
  return crypto.createHmac("sha256", secret).update(message).digest("base64");
}

const createDepositEsewa = async (id, amount) => {
  const hashInput = `total_amount=${amount},transaction_uuid=${id},product_code=EPAYTEST`;
  const signature = generateSignature(hashInput, process.env.ESEWA_SECRET);
  const body = {
    amount: amount,
    failure_url: `${process.env.BASE_URL}/deposit/esewa/notify`,
    product_delivery_charge: "0",
    product_service_charge: "0",
    product_code: "EPAYTEST",
    signed_field_names: "total_amount,transaction_uuid,product_code",
    success_url: `${process.env.BASE_URL}/deposit/esewa/notify`,
    tax_amount: 0,
    total_amount: amount,
    transaction_uuid: id,
    signature,
  };
  const { data } = await axios.post(
    `${process.env.ESEWA_API}/epay/main/v2/form`,
    body,
  );
  console.log(data);
  return data;
};

module.exports = { createDepositKhati, createDepositEsewa };

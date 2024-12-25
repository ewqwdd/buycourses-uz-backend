const nodemailer = require("nodemailer");
require("dotenv").config();

const mailer = nodemailer.createTransport({
  service: "Gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GOOGLE_EMAIL,
    pass: process.env.GOOGLE_PASSWORD,
  },
});

const sendLink = (to, link) => {
  mailer.sendMail({
    from: process.env.GOOGLE_EMAIL,
    to,
    subject: "Ваша ссылка для входа",
    html: `<div style="font-family:Arial,sans-serif;padding:20px;text-align: center;">
        <h1>Для входа в приложение перейдите по ссылке</h1>
        <a href="${link}" style="display:inline-block;margin-top:20px;padding:10px 20px;background-color:#007bff;color:#fff;text-decoration:none;border-radius:5px;">Войти</a>
      </div>`,
  });
};

module.exports = { mailer, sendLink };

const express = require("express");
const passport = require("passport");
const { User } = require("../models/User");
const { sendLink } = require("../lib/mailer");
const { hashPassword } = require("../lib/passwords");
const authMiddleware = require("../middleware/authMiddleware");
const { Product, Transaction } = require("../models");
require("dotenv").config();

const router = express.Router();
// Registration endpoint
router.post("/register", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .send({ message: "Email and password are required" });
    }

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res
        .status(400)
        .send({ message: "Пользователь с этой почтой уже существует" });
    }

    res.setHeader("Access-Control-Allow-Credentials", true);
    res.setHeader("Access-Control-Allow-Origin", process.env.APP_URL);
    const hashedPassword = await hashPassword(password);

    const user = await User.create({ email, password: hashedPassword });

    req.logIn(user, (err) => {
      if (err) {
        console.error("Error during login:", err);
        return next(err);
      }

      return res.status(201).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
        },
      });
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Login endpoint
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ message: info.message });
    }
    res.setHeader("Access-Control-Allow-Credentials", true);
    res.setHeader("Access-Control-Allow-Origin", process.env.APP_URL);
    // Логиним пользователя
    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          balance: user.balance,
        },
      });
    });
  })(req, res, next);
});

// Authentication endpoint
router.get("/auth", (req, res, next) => {
  if (req.query.hash) {
    req.body.hash = req.query.hash; // Копируем hash из query в body
  }
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", process.env.APP_URL);
  passport.authenticate("email-link", { session: true }, (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(400).send({ message: info.message });

    req.logIn(user, (err) => {
      if (err) return next(err);
      res.status(200).send({ success: true });
    });
  })(req, res, next);
});

router.post("/resend", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).send({ message: "Email is required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).send({ message: "Invalid email" });
    }
    sendLink(
      email,
      `${process.env.APP_URL}/email-confirm/?hash=${user.emailLink}`,
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error during resend:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Logout endpoint
router.post("/logout", (req, res) => {
  req.logOut();
  res.clearCookie("session");
  res.clearCookie("session.sig");
  res.status(200).json({ success: true });
  return;
});

// User information endpoint
router.get("/me", authMiddleware, async (req, res) => {
  const user = await User.findOne({
    where: { id: req.user.id },
    attributes: { exclude: ["password"] },
    include: [
      {
        model: Product,
        as: "products",
      },
      {
        model: Transaction,
        as: "transactions",
      },
      {
        model: Product,
        as: "purchasedProducts",
      },
    ],
  });

  res.status(200).json(user);
});

module.exports = router;

const express = require("express");
const passport = require("passport");
const { User } = require("../models/User");
const { generateLink } = require("../lib/generateLink");
const { sendLink } = require("../lib/mailer");
const { hashPassword, verifyPassword } = require("../lib/passwords");
require("dotenv").config();

const router = express.Router();
// Registration endpoint
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send({ message: "Email and password are required" });
    }

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).send({ message: "User with this email already exists" });
    }
    const hashedPassword = await hashPassword(password);

    // Create a new user
    const user = new User({ email, password: hashedPassword });
    const { link, hash } = generateLink();
    sendLink(email, link);
    user.emailLink = hash;
    await user.save();

    return res.status(201).json({ success: true });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send({ message: "Email and password are required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).send({ message: "Invalid email or password" });
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).send({ message: "Invalid email or password" });
    }

    const { link, hash } = generateLink();

    user.emailLink = hash;
    await user.save();
    sendLink(email, link);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Authentication endpoint
router.get("/auth", (req, res, next) => {
  if (req.query.hash) {
    req.body.hash = req.query.hash; // Копируем hash из query в body
  }
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_URL);
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
    sendLink(email, `${process.env.APP_URL}/email-confirm/?hash=${user.emailLink}`);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error during resend:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Logout endpoint
router.post("/logout", (req, res) => {
  req.logOut()
  res.clearCookie('session')
  res.clearCookie('session.sig')
  res.status(200).json({ success: true });
  return
});

// User information endpoint
router.get("/me", (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).send({ message: "Not authenticated" });
  }

  res.status(200).send({
    id: req.user.id,
    email: req.user.email,
    createdAt: req.user.createdAt,
    balance: req.user.balance,
  });
});

module.exports = router;

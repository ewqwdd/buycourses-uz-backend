const express = require("express");
const cors = require("cors");
const passport = require("passport");
const session = require("cookie-session");
const LocalStrategy = require("passport-local").Strategy;
const { initializeDatabase } = require("./sequelize/sequelize");
const { User } = require("./models/User");
const { verifyPassword } = require("./lib/passwords");
const path = require("path");
const app = express();
require("dotenv").config();

app.use(
  cors({
    credentials: true,
    origin: process.env.APP_URL,
  }),
);

const isDev = process.env.BASE_URL.includes("localhost");

if (!isDev) {
  app.set("trust proxy", 1);
}

app.use(express.json());
app.use(
  session({
    name: "session",
    keys: [process.env.SESSION_SECRET || "secret"],
    maxAge: 24 * 60 * 60 * 1000 * 15, // 15 day
    sameSite: isDev ? "lax" : "none",
    secure: !isDev,
  }),
);
app.use(passport.initialize());
app.use(passport.session());

initializeDatabase();

// Passport configuration
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  "email-link",
  new LocalStrategy(
    { usernameField: "hash", passReqToCallback: true, passwordField: "hash" },
    async (req, hash, _, done) => {
      try {
        const user = await User.findOne({ where: { emailLink: hash } });
        if (!user) {
          return done(null, false, { message: "Invalid link or user" });
        }

        user.emailLink = null; // Инвалидируем ссылку после использования
        await user.save();
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

passport.use(
  "local",
  new LocalStrategy(
    {
      usernameField: "email", // Поле для email
      passwordField: "password", // Поле для пароля
      passReqToCallback: true, // Передача req в callback
    },
    async (req, email, password, done) => {
      try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
          return done(null, false, { message: "Неверная почта или пароль" });
        }

        const verified = await verifyPassword(password, user.password);
        if (!verified) {
          return done(null, false, { message: "Неверная почта или пароль" });
        }

        // Если всё успешно
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

app.use(express.static(path.join(__dirname, "../buycourses-uz/dist")));

app.use(require("./routes/defaultRouter"));
app.use("/deposit", require("./routes/depositRouter"));
app.use("/categories", require("./routes/categoryRouter"));
app.use("/products", require("./routes/productsRouter"));
app.use("/withdraws", require("./routes/withdrawRouter"));
app.use("/transactions", require("./routes/transactionRouter"));
app.use("/a", require("./routes/callbackRouter"));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../buycourses-uz/dist", "index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

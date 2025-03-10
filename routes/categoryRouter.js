const express = require("express");
const slugify = require("slugify");
const { Category, Product } = require("../models");
require("dotenv").config();

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, img } = req.body;
    const slug = slugify(name, {
      lower: true,
      remove: /[*+~.()'"!:@]/g,
      locale: "uk",
    });
    const category = await Category.create({ name, slug, img });
    res.json(category);
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const { limit, page } = req.query;
    const products = await Product.findAll({
      include: {
        model: Category,
        where: { slug }, // Фильтр по slug категории
      },
      limit: limit,
      offset: limit * page,
    });
    const total = await Product.count({
      include: {
        model: Category,
        where: { slug }, // Фильтр по slug категории
      },
    });

    res.json({ items: products, total });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

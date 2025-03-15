const express = require("express");
const slugify = require("slugify");
const { Category, Product } = require("../models");
const adminMiddleware = require("../middleware/adminMiddleware");
const { uploadImageToS3, deleteImageFromS3 } = require("../lib/s3Service");
const multer = require("multer");
require("dotenv").config();
const path = require("path");

const router = express.Router();

const upload = multer({
  dest: path.join(__dirname, "../public/temp"),
});

router.get("/", async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", adminMiddleware, async (req, res) => {
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

router.put(
  "/:slug/image",
  adminMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const { slug } = req.params;
      const { file } = req;
      const category = await Category.findOne({ where: { slug } });
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      let image = category?.img;

      if (file) {
        if (image) {
          await deleteImageFromS3(category?.img.split("amazonaws.com/").pop());
        }
        const ext = file.originalname.split(".").pop();
        const newName = `${file.filename}_${Date.now()}.${ext}`;
        image = await uploadImageToS3(file.path, newName, "categories");
      }

      await Category.update({ img: image }, { where: { slug } });
      res.json({ img: image });
    } catch (error) {
      console.error("Unable to connect to the database:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

router.delete("/:slug", adminMiddleware, async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await Category.findOne({ where: { slug } });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    if (category.img) {
      await deleteImageFromS3(category.img.split("amazonaws.com/").pop());
    }
    await Category.destroy({ where: { slug } });
    res.json({ message: "Category deleted" });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

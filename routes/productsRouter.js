const express = require("express");
const slugify = require("slugify");
const { Product, Material, Category, Transaction, User } = require("../models");
const authMiddleware = require("../middleware/authMiddleware");
const { uploadImageToS3, deleteImageFromS3 } = require("../lib/s3Service");
const multer = require("multer");
require("dotenv").config();
const path = require("path");

const upload = multer({
  dest: path.join(__dirname, "../public/temp"),
});

const router = express.Router();

router.post("/", upload.single("image"), authMiddleware, async (req, res) => {
  try {
    const { id } = req.user;
    const { name, img, content, materials, categoryId, customCategory, price } =
      req.body;

    if (!name || !content || !materials || parseFloat(price) <= 0) {
      return res
        .status(400)
        .json({ message: "Название, изображение и описание обязательны" });
    }
    if (!categoryId && !customCategory) {
      return res
        .status(400)
        .json({ message: "Выберите категорию или укажите свою" });
    }
    const slug = slugify(name, {
      lower: true,
      remove: /[*+~.()'"!:@]/g,
      locale: "uk",
    });

    const foundProduct = await Product.findOne({
      where: { slug },
      attributes: { exclude: ["content"] },
    });
    if (foundProduct) {
      return res
        .status(400)
        .json({ message: "Продукт с таким названием уже существует" });
    }

    let newId = categoryId;
    console.log(newId)
    if (newId == -1) {
      const slug = slugify(customCategory, {
        lower: true,
        remove: /[*+~.()'"!:@]/g,
        locale: "uk",
      });
      const foundCategory = await Category.findOne({ where: { slug } });
      if (foundCategory) {
        return res
          .status(400)
          .json({ message: "Категория с таким названием уже существует" });
      }
      const category = await Category.create({ name: customCategory, slug });
      console.log(category);
      newId = category.dataValues.id;
    }

    const { file } = req;
    let image = foundProduct?.image;

    if (file) {
      if (image) {
        await deleteImageFromS3(
          foundProduct?.image.split("amazonaws.com/").pop()
        );
      }
      const ext = file.originalname.split(".").pop();
      const newName = `${file.filename}_${Date.now()}.${ext}`; 
      image = await uploadImageToS3(file.path, newName, "products");
    }

    const product = await Product.create({
      name,
      slug,
      img,
      content,
      userId: id,
      price: parseFloat(price),
      categoryId: newId,
      image,
    });

    const parsed = typeof materials === 'string' ? JSON.parse(materials) : materials;
    if (Array.isArray(parsed) && parsed.length > 0) {
      const materialData = parsed.map((material) => ({
        name: material.name,
        url: material.url,
        productId: product.id,
      }));
      await Material.bulkCreate(materialData);
    }

    res.json(product);
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ where: { slug } });
    if (!product) {
      return res.status(404).json({ message: "Продукт не найден" });
    }
    res.json(product);
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

router.post("/buy", authMiddleware, async (req, res) => {
  try {
    const { id } = req.user;
    const { productId } = req.body;
    const product = await Product.findByPk(productId, {
      include: {
        model: Material,
        as: "materials",
      },
    });
    if (!product) {
      return res.status(404).json({ message: "Продукт не найден" });
    }
    if (product.userId === id) {
      return res.status(400).json({ message: "Нельзя купить свой продукт" });
    }
    const buyer = await User.findByPk(id, {
      include: {
        model: Product,
        as: "purchasedProducts",
      },
    });

    if (buyer && buyer.purchasedProducts.find((e) => e.id === productId)) {
      return res.status(400).json({ message: "Этот продукт уже куплен вами" });
    }
    if (buyer.balance < product.price) {
      return res.status(400).json({ message: "Недостаточно средств" });
    }
    const seller = await User.findByPk(product.userId);
    buyer.balance -= product.price;
    seller.balance += product.price;
    await buyer.save();
    await seller.save();
    await buyer.addPurchasedProduct(product);
    await Transaction.create({
      userId: id,
      productId,
      amount: product.price,
      type: "buy",
    });
    await Transaction.create({
      userId: product.userId,
      amount: product.price,
      productId,
      type: "sell",
    });
    res.json(product);
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

module.exports = router;

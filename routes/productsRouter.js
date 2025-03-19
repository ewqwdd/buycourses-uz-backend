const express = require("express");
const slugify = require("slugify");
const {
  Product,
  Category,
  Transaction,
  User,
  UserBasket,
} = require("../models");
const authMiddleware = require("../middleware/authMiddleware");
const { uploadImageToS3, deleteImageFromS3 } = require("../lib/s3Service");
const multer = require("multer");
require("dotenv").config();
const path = require("path");
const { typings } = require("../lib/typings");
const adminMiddleware = require("../middleware/adminMiddleware");

const upload = multer({
  dest: path.join(__dirname, "../public/temp"),
});

const router = express.Router();

router.post("/", upload.single("image"), authMiddleware, async (req, res) => {
  try {
    const { id } = req.user;
    const { name, img, content, categoryId, customCategory, price } = req.body;

    if (!name || parseFloat(price) < 0) {
      return res
        .status(400)
        .json({ message: typings.titleDescriptionRequired });
    }
    if (!categoryId && !customCategory) {
      return res.status(400).json({ message: typings.chooseOrCreateCategory });
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
      return res.status(400).json({ message: typings.productExists });
    }

    let newId = categoryId;
    console.log(newId);
    if (newId == -1) {
      const slug = slugify(customCategory, {
        lower: true,
        remove: /[*+~.()'"!:@]/g,
        locale: "uk",
      });
      const foundCategory = await Category.findOne({ where: { slug } });
      if (foundCategory) {
        return res.status(400).json({ message: typings.categoryExists });
      }
      const category = await Category.create({ name: customCategory, slug });
      newId = category.dataValues.id;
    }

    const { file } = req;
    let image = foundProduct?.image;

    if (file) {
      if (image) {
        await deleteImageFromS3(
          foundProduct?.image.split("amazonaws.com/").pop(),
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

    res.json(product);
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/", async (req, res) => {
  try {

    const products = await Product.findAll({
      order: [["createdAt", "DESC"]],
    });


    if (!products) {
      return res.status(404).json({ message: typings.productNotFound });
    }
    res.json({items: products});
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ where: { slug } });
    if (!product) {
      return res.status(404).json({ message: typings.productNotFound });
    }
    res.json(product);
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/buy", authMiddleware, async (req, res) => {
  try {
    const { id } = req.user;
    const { productId } = req.body;
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: typings.productNotFound });
    }

    const buyer = await User.findByPk(id, {
      include: {
        model: Product,
        as: "purchasedProducts",
      },
    });

    if (buyer.balance < product.price) {
      return res.status(400).json({ message: typings.insufficientFunds });
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
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/cart/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.user;
    const { id: productId } = req.params;
    const { amount } = req.body;
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: typings.productNotFound });
    }

    const inCartProduct = await UserBasket.findOne({
      where: {
        userId: id,
        productId,
      },
    });

    if (inCartProduct) {
      if (amount) {
        inCartProduct.amount = amount;
      } else {
        inCartProduct.amount += 1;
      }
      await inCartProduct.save();
      return res.json(product);
    }

    const newProduct = await UserBasket.create({
      userId: id,
      productId,
      amount: 1,
    });

    res.json(newProduct);
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/cart/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.user;
    const { id: productId } = req.params;
    const { deleteAll } = req.body;
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: typings.productNotFound });
    }

    const inCartProduct = await UserBasket.findOne({
      where: {
        userId: id,
        productId,
      },
    });

    if (inCartProduct) {
      inCartProduct.amount -= 1;
      if (inCartProduct.amount === 0 || deleteAll) {
        await inCartProduct.destroy();
      } else {
        await inCartProduct.save();
      }
      return res.json(product);
    } else {
      return res.json({ message: typings.productNotFound });
    }
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: typings.productNotFound });
    }
    if (product.image) {
      await deleteImageFromS3(product.image.split("amazonaws.com/").pop());
    }
    await product.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

const { Category } = require("./Category");
const { Product } = require("./Product");
const { Transaction } = require("./Transaction");
const { User } = require("./User");
const { UserBasket } = require("./UserBasket");
const { UserProducts } = require("./UserProducts");
const { Withdraw } = require("./Withdraw");

// Ассоциации для Category
Category.hasMany(Product, {
  foreignKey: "categoryId",
});

// Ассоциации для Product
Product.belongsTo(Category, {
  foreignKey: {
    name: "categoryId",
    allowNull: false,
  },
});

Product.belongsTo(User, {
  foreignKey: {
    name: "userId",
    allowNull: true,
  },
  as: "owner", // Пользователь, который продает продукт
});

// Ассоциации для Transaction
Transaction.belongsTo(User, {
  foreignKey: {
    name: "userId",
    allowNull: false,
  },
});

Transaction.belongsTo(Product, {
  foreignKey: {
    name: "productId",
    allowNull: true,
  },
});

Transaction.belongsTo(Withdraw, {
  foreignKey: {
    name: "withdrawId",
    allowNull: true,
  },
});

// Ассоциации для Withdraw
Withdraw.belongsTo(User, {
  foreignKey: {
    name: "userId",
    allowNull: false,
  },
});

Withdraw.hasOne(Transaction, {
  foreignKey: {
    name: "withdrawId",
    allowNull: true,
  },
  as: "transaction",
});

// Ассоциации для User
User.hasMany(Product, {
  foreignKey: "userId",
  as: "products", // Продаваемые продукты
});

User.hasMany(Transaction, {
  foreignKey: "userId",
  as: "transactions",
});

User.hasMany(Withdraw, {
  foreignKey: "userId",
  as: "withdraws",
});

User.belongsToMany(Product, {
  through: "UserProducts",
  as: "purchasedProducts", // Купленные товары
  foreignKey: "userId",
});

Product.belongsToMany(User, {
  through: "UserProducts",
  as: "buyers", // Пользователи, которые купили продукт
  foreignKey: "productId",
});

User.belongsToMany(Product, {
  through: "UserBasket",
  as: "basket", // Купленные товары
  foreignKey: "userId",
});

Product.belongsToMany(User, {
  through: "UserBasket",
  as: "basket_buyers", // Пользователи, которые купили продукт
  foreignKey: "productId",
});

module.exports = {
  Category,
  Product,
  Transaction,
  User,
  UserProducts,
  UserBasket,
};

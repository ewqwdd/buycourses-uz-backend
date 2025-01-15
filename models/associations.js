const { Category } = require("./Category");
const { Material } = require("./Material");
const { Product } = require("./Product");
const { Transaction } = require("./Transaction");
const { User } = require("./User");
const { UserProducts } = require("./UserProducts");
const { Withdraw } = require("./Withdraw");

// Ассоциации для Category
Category.hasMany(Product, {
  foreignKey: "categoryId",
});

// Ассоциации для Material
Material.belongsTo(Product, {
  foreignKey: {
    name: "productId",
    allowNull: false,
  },
});

// Ассоциации для Product
Product.belongsTo(Category, {
  foreignKey: {
    name: "categoryId",
    allowNull: false,
  },
});

Product.hasMany(Material, {
  foreignKey: "productId",
  as: "materials",
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

module.exports = {
  Category,
  Material,
  Product,
  Transaction,
  User,
  UserProducts,
};

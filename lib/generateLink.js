require("dotenv").config();
const uuid = require("uuid").v4;

const generateLink = () => {
  const salt = uuid();
  return {link: `${process.env.BASE_URL}/auth/?hash=${salt}`, hash: salt};
};

module.exports = { generateLink };

require("dotenv").config();
const uuid = require("uuid").v4;

const generateLink = () => {
  const salt = uuid();
  return {
    link: `${process.env.APP_URL}/email-confirm/?hash=${salt}`,
    hash: salt,
  };
};

module.exports = { generateLink };

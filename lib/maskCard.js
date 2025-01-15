const maskCard = (cardNumber) => {
  const cleaned = cardNumber.replace(/\s+/g, "");

  const firstFour = cleaned.slice(0, 4);
  const lastFour = cleaned.slice(-4);

  const maskedSection = "*".repeat(cleaned.length - 8);

  const maskedCardNumber = firstFour + maskedSection + lastFour;

  return maskedCardNumber.match(/.{1,4}/g).join(" ");
};

module.exports = maskCard;
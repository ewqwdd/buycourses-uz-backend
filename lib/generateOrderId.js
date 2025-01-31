function generateOrderId() {
    const timestamp = Math.floor(Date.now() / 1000);

    const timestampHex = timestamp.toString(16).slice(0, 8);

    const randomBytes = Math.floor(Math.random() * 0xffffffff);

    const randomHex = randomBytes.toString(16).padStart(8, '0');

    const orderId = timestampHex + randomHex;

    return orderId;
}

module.exports = { generateOrderId };
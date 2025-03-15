const { Telegraf } = require("telegraf");
require("dotenv").config();

// Замените 'YOUR_TELEGRAM_BOT_TOKEN' на токен вашего бота
const bot = new Telegraf(process.env.BOT_TOKEN);

// Замените '@your_channel_username' на юзернейм вашего канала
const channelId = process.env.CHAT_ID;

// Функция для отправки сообщения в канал
const sendMessageToChannel = async (message, silent) => {
  try {
    await bot.telegram.sendMessage(channelId, message, {
      parse_mode: "Markdown",
      disable_notification: silent,
    });
    console.log("Message sent to the channel");
  } catch (error) {
    console.error("Error sending message:", error);
  }
};

// Запуск бота
bot.launch();

// Бот будет завершаться корректно при нажатии Ctrl+C
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

module.exports = { sendMessageToChannel };

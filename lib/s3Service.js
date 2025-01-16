const AWS = require("aws-sdk");
require("dotenv").config();
const fs = require("fs");
const sharp = require("sharp");

// Инициализация AWS S3
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  signatureVersion: "v4",
});
const bucketName = process.env.AWS_BUCKET_NAME;

function deleteFileAfterDelay(filePath, delay = 15 * 60 * 1000) {
  // 15 минут по умолчанию
  setTimeout(() => {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Ошибка при удалении файла ${filePath}:`, err);
      } else {
        console.log(`Файл ${filePath} был удален через 15 минут.`);
      }
    });
  }, delay);
}

async function uploadImageToS3(filePath, fileName, folderName) {
  try {
    // Чтение файла и преобразование в WebP
    const webpBuffer = await sharp(filePath)
      .webp({ quality: 80 }) // Укажите желаемое качество (от 1 до 100)
      .toBuffer();

    const params = {
      Bucket: bucketName,
      Key: `${folderName}/${fileName.split(".")[0]}.webp`, // Используем расширение .webp
      Body: webpBuffer,
      ContentType: "image/webp",
    };

    const data = await s3.upload(params).promise();
    return data.Location; // URL загруженного изображения
  } catch (error) {
    console.error("Error processing and uploading image:", error);
  }
}

async function deleteImageFromS3(key) {
  try {
    const params = {
      Bucket: bucketName,
      Key: key,
    };

    await s3.deleteObject(params).promise();
    console.log("Previous image deleted successfully:", key);
  } catch (error) {
    console.error("Error deleting image from S3:", error);
  }
}

module.exports = {
  s3,
  bucketName,
  deleteFileAfterDelay,
  uploadImageToS3,
  deleteImageFromS3,
};

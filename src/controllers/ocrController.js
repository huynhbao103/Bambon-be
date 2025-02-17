const Tesseract = require("tesseract.js");
const fs = require("fs").promises;
const sharp = require("sharp");
const Image = require("../models/imageModel");
const path = require("path");

// Hàm xử lý ảnh với Sharp
const processImage = async (imagePath) => {
  const processedImagePath = path.join(__dirname, "processedImage.jpg");

  // Xử lý ảnh (chuyển sang grayscale, normalize)
  await sharp(imagePath)
    .grayscale()
    .normalize()
    .toFile(processedImagePath);

  return processedImagePath;
};

// Hàm thực hiện OCR
const performOCR = async (imagePath) => {
  const { data: { text } } = await Tesseract.recognize(
    imagePath,
    "vie+eng", 
    {
      logger: (m) => console.log(m),
      tessdata: "./tessdata",
      config: {
        tessedit_char_whitelist: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 
        psm: Tesseract.PSM.SINGLE_BLOCK
      }
    }
  );
  
  return text;
};

// Controller xử lý upload và OCR
exports.uploadAndProcessImage = async (req, res) => {
  const imagePath = req.file.path;

  try {
    // Xử lý ảnh trước khi OCR
    const processedImagePath = await processImage(imagePath);

    // Thực hiện OCR
    const text = await performOCR(processedImagePath);
    console.log("OCR result:", text);

    // Lưu kết quả OCR vào database
    const imageRecord = new Image({
      filename: req.file.originalname,
      text,
    });
    await imageRecord.save();

    // Trả về kết quả OCR cho client
    res.json({ text });
  } catch (error) {
    console.error("Lỗi xử lý OCR:", error);
    res.status(500).json({ error: error.message });
  } finally {
    // Xóa file gốc và file đã xử lý sau khi xử lý xong
    try {
      await fs.unlink(imagePath);
      await fs.unlink(path.join(__dirname, "processedImage.jpg"));
    } catch (err) {
      console.warn("Không thể xóa file:", err);
    }
  }
};

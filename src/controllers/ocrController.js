const Tesseract = require("tesseract.js");
const sharp = require("sharp");
const Transaction = require("../models/Transaction.models");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fetch = require("node-fetch"); // Add this dependency

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const processImage = async (imageBuffer) => {
  try {
    const processedImageBuffer = await sharp(imageBuffer)
      .grayscale()
      .normalize()
      .toBuffer();
    return processedImageBuffer;
  } catch (error) {
    throw new Error(`Sharp processing failed: ${error.message}`);
  }
};

const performOCR = async (imageBuffer) => {
  const { data: { text } } = await Tesseract.recognize(imageBuffer, "vie+eng", {
    logger: (m) => console.log(m),
    config: {
      tessedit_char_whitelist: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
      psm: Tesseract.PSM.SINGLE_BLOCK,
    },
  });
  return text.replace(/\n/g, " ");
};

const generateTransactionJSON = async (text) => {
  const prompt = `sử dụng tiếng việt.
  Chuyển đổi đoạn văn bản sau thành định dạng JSON hợp lệ cho giao dịch tài chính:
  "${text}"
  Yêu cầu JSON chỉ gồm:
  {
    type: { type: String, enum: ['income', 'expense'], required: true },
    category: { type: String, required: true },
    items: [{ productName: String, quantity: Number, price: Number }],
    amount: Number
  }.
  Tự chọn "category" phù hợp với giao dịch.
  Chỉ trả về JSON, không thêm bất kỳ bình luận hay nội dung nào khác.
  Tính toán amount.
  Nếu giá (price) không có trong văn bản, đặt giá là 0.
  Nếu không phân tích được, trả về { "note": "Lỗi phân tích hóa đơn." }.
  `;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  const jsonText = result.response
    .text()
    .replace(/```json|\n|```/g, "")
    .replace(/\/\/.*$/gm, "")
    .trim();
  return jsonText;
};

exports.uploadAndProcessImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Không có file nào được upload." });
  }

  try {
    // Log Cloudinary result
    console.log("Cloudinary file:", req.file);

    // Fetch image from Cloudinary URL
    const imageUrl = req.file.path; // This is the Cloudinary URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from Cloudinary: ${response.statusText}`);
    }
    const imageBuffer = await response.buffer(); // Get raw image data as buffer

    // Process the image
    const processedImageBuffer = await processImage(imageBuffer);
    const text = await performOCR(processedImageBuffer);
    console.log("OCR result:", text);

    // Generate transaction JSON
    const resultText = await generateTransactionJSON(text);
    console.log("Raw JSON từ AI:", resultText);

    let transactionData;
    try {
      transactionData = JSON.parse(resultText);
    } catch (error) {
      console.error("Chuỗi JSON lỗi:", resultText);
      return res.status(500).json({ error: `Lỗi phân tích JSON: ${error.message}` });
    }

    if (transactionData.note) {
      return res.status(200).json({ note: transactionData.note });
    }

    transactionData.userId = req.user?.id || req.body.userId;
    if (!transactionData.userId) {
      return res.status(400).json({ error: "Thiếu userId trong request." });
    }

    const newTransaction = new Transaction(transactionData);
    await newTransaction.save();

    res.status(200).json({
      message: "Dữ liệu giao dịch đã được lưu thành công!",
      data: transactionData,
      imageUrl: imageUrl,
    });
  } catch (error) {
    console.error("Lỗi xử lý:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;
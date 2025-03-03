const Tesseract = require("tesseract.js");
const fs = require("fs").promises;
const sharp = require("sharp");
const Image = require("../models/imageModel");
const Transaction = require("../models/Transaction.models");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const processImage = async (imagePath) => {
  const processedImagePath = path.join(__dirname, "processedImage.jpg");
  await sharp(imagePath).grayscale().normalize().toFile(processedImagePath);
  return processedImagePath;
};

const performOCR = async (imagePath) => {
  const { data: { text } } = await Tesseract.recognize(imagePath, "vie+eng", {
    logger: (m) => console.log(m),
    config: {
      tessedit_char_whitelist: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
      psm: Tesseract.PSM.SINGLE_BLOCK
    }
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
  const jsonText = result.response.text()
    .replace(/```json|\n|```/g, '')
    .replace(/\/\/.*$/gm, '')
    .trim();
  return jsonText;
};

exports.uploadAndProcessImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Không có file nào được upload." });
  }

  const imagePath = req.file.path;

  try {
    // 1. OCR trích xuất văn bản từ ảnh
    const processedImagePath = await processImage(imagePath);
    const text = await performOCR(processedImagePath);
    console.log("OCR result:", text);

    // 2. Gửi lên AI để tạo JSON
    const resultText = await generateTransactionJSON(text);
    console.log("Raw JSON từ AI:", resultText);

    // 3. Parse JSON
    let transactionData;
    try {
      transactionData = JSON.parse(resultText);
    } catch (error) {
      console.error("Chuỗi JSON lỗi:", resultText);
      return res.status(500).json({ error: `Lỗi phân tích JSON: ${error.message}` });
    }

    // Nếu OCR không phân tích được, trả về note
    if (transactionData.note) {
      return res.status(200).json({ note: transactionData.note });
    }

    // 4. Thêm userId từ request (giả sử userId lấy từ req.user hoặc req.body)
    transactionData.userId = req.user?.id || req.body.userId; // Điều chỉnh tùy theo cách bạn xác thực user
    if (!transactionData.userId) {
      return res.status(400).json({ error: "Thiếu userId trong request." });
    }

    // 5. Lưu trực tiếp vào database
    const newTransaction = new Transaction(transactionData);
    await newTransaction.save();

    // 6. Trả kết quả về client
    res.status(200).json({
      message: "Dữ liệu giao dịch đã được lưu thành công!",
      data: transactionData,
    });
  } catch (error) {
    console.error("Lỗi xử lý:", error);
    res.status(500).json({ error: error.message });
  } finally {
    await fs.unlink(imagePath).catch(() => {});
    await fs.unlink(path.join(__dirname, "processedImage.jpg")).catch(() => {});
  }
};

module.exports = exports;
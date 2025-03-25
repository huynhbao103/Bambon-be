const Tesseract = require("tesseract.js");
const sharp = require("sharp");
const Transaction = require("../models/Transaction.models");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fetch = require("node-fetch");
const path = require("path");
// const worder = require("../../public/tesseract/worker.min.js");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const processImage = async (imageBuffer) => {
  try {
    const processedImageBuffer = await sharp(imageBuffer)
      .resize({ width: 1200 }) // Increased resolution for better detail
      .gamma(1.2) // Adjust gamma for better contrast
      .normalize() // Normalize the image
      .sharpen({ // Enhanced sharpening
        sigma: 1.5,
        m1: 0.5,
        m2: 0.5
      })
      .toBuffer();
    return processedImageBuffer;
  } catch (error) {
    throw new Error(`Sharp processing failed: ${error.message}`);
  }
};

const performOCR = async (imageBuffer) => {
  try {
    const { data: { text } } = await Tesseract.recognize(imageBuffer, "vie+eng+tha", {
      logger: (m) => console.log(m),
      corePath: path.resolve(__dirname, "../public/tesseract/tesseract-core-simd.wasm"),
      langPath: path.resolve(__dirname, "../public/tesseract"),
      config: {
        psm: Tesseract.PSM.AUTO, // Changed to AUTO for better layout analysis
        tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,฿$₫-_()/@&%", // Added more special characters
        tessedit_pageseg_mode: "1", // Automatic page segmentation with OSD
        tessedit_ocr_engine_mode: "3", // Use Legacy + LSTM engines
        preserve_interword_spaces: "1",
        language_model_penalty_non_dict_word: "0.5",
        language_model_penalty_non_freq_dict_word: "0.5"
      },
    });

    // Enhanced text cleaning
    let cleanedText = text
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ") // Remove multiple spaces
      .replace(/[^\x00-\x7F\u0E00-\u0E7F\u0102\u0103\u0110\u0111\u0128\u0129\u0168\u0169\u01A0\u01A1\u01AF\u01B0\u1EA0-\u1EF9฿]/g, "") // Keep Thai, Vietnamese chars
      .trim();
    
    return cleanedText;
  } catch (error) {
    throw new Error(`OCR failed: ${error.message}`);
  }
};

const generateTransactionJSON = async (text) => {
  const prompt = `
  Chuyển đổi đoạn văn bản sau thành định dạng JSON hợp lệ cho giao dịch tài chính:
  "${text}"
  Yêu cầu JSON chỉ gồm:
  {
    type: { type: String, enum: ['income', 'expense'], required: true },
    category: { type: String, required: true },
    items: [{ productName: String, quantity: Number, price: Number }],
    amount: Number
  }.
  Lưu ý đặc biệt:
  nhận diện tiền tệ:
  - Nếu phát hiện đơn vị tiền tệ là THB (Thai Baht), hãy chuyển đổi sang VND với tỷ giá: 1 THB = 750 VND
  - Tự động nhận diện và chuyển đổi tiền tệ từ THB sang VND cho cả amount và price trong items
  Tự chọn "category" phù hợp với giao dịch.
  Chỉ trả về JSON, không thêm bất kỳ bình luận hay nội dung nào khác.
  Nếu không có danh mục (category) phù hợp, đặt category là "Khác".
  nếu tiền tệ và chữ không phải là việt nam  thì chuyển đổi sang mệnh giá tiềntiền việt và chuyển ngôn ngữ tiếng việt.
  Nếu không có số tiền (amount) trong văn bản, tính toán amount từ danh sách items,Tính toán amount chuẩn từng số. 
  Nếu không có danh sách items, đặt items là rỗng [].
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
    console.log("Step 1 - Cloudinary file:", req.file);
    const startTime = Date.now();

    // Fetch image from Cloudinary URL
    const imageUrl = req.file.path;
    console.log("Step 2 - Fetching image from:", imageUrl);
    const fetchStart = Date.now();
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from Cloudinary: ${response.statusText}`);
    }
    const imageBuffer = await response.buffer();
    console.log(`Step 3 - Fetch time: ${Date.now() - fetchStart}ms, Buffer size: ${imageBuffer.length}`);

    // Process the image
    console.log("Step 4 - Processing image with sharp");
    const sharpStart = Date.now();
    const processedImageBuffer = await processImage(imageBuffer);
    console.log(`Step 5 - Sharp time: ${Date.now() - sharpStart}ms`);

    // Perform OCR
    console.log("Step 6 - Starting OCR");
    const ocrStart = Date.now();
    const text = await performOCR(processedImageBuffer);
    console.log(`Step 7 - OCR time: ${Date.now() - ocrStart}ms, Result: ${text}`);

    // Generate transaction JSON
    console.log("Step 8 - Generating JSON with AI");
    const aiStart = Date.now();
    const resultText = await generateTransactionJSON(text);
    console.log(`Step 9 - AI time: ${Date.now() - aiStart}ms, Raw JSON: ${resultText}`);

    let transactionData;
    try {
      transactionData = JSON.parse(resultText);
      console.log("Step 10 - Parsed transaction data:", transactionData);
    } catch (error) {
      console.error("Step 10 - JSON parse error:", error.message);
      return res.status(500).json({ error: `Lỗi phân tích JSON: ${error.message}` });
    }

    if (transactionData.note) {
      return res.status(200).json({ note: transactionData.note });
    }

    transactionData.userId = req.user?.id || req.body.userId;
    if (!transactionData.userId) {
      return res.status(400).json({ error: "Thiếu userId trong request." });
    }

    // Save to database
    console.log("Step 11 - Saving transaction to DB");
    const dbStart = Date.now();
    const newTransaction = new Transaction(transactionData);
    await newTransaction.save();
    console.log(`Step 12 - DB time: ${Date.now() - dbStart}ms`);

    console.log(`Total time: ${Date.now() - startTime}ms`);
    res.status(200).json({
      message: "Dữ liệu giao dịch đã được lưu thành công!",
      data: transactionData,
      imageUrl: imageUrl,
    });
  } catch (error) {
    console.error("Lỗi xử lý:", error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;
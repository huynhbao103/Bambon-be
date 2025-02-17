import { GoogleGenerativeAI } from "@google/generative-ai";
import GeneratedContent from "../models/generatedContentSchema.js";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export const generateContent = async (req, res) => {
  try {
    const { userPrompt } = req.body;

    if (!userPrompt) {
      return res.status(400).json({ error: "Prompt không được để trống." });
    }

    const finalPrompt = `Chuyển đổi đoạn văn bản sau thành định dạng JSON .
    Lọc và phân tích lại hóa đơn sao cho hợp lệ.
    : "${userPrompt}" Đảm bảo JSON chỉ bao gồm các trường tự phần loại "category": 
      'type', 'category', 'items' (mỗi item có 'productName', 'quantity', 'price'), 'totalAmount'.
    Nếu không hợp lệ, trả về JSON với trường duy nhất là "note" để thông báo lỗi.
    Yêu cầu định dạng JSON đúng, với:
    {
      type: { type: String, enum: ['income', 'expense'], required: true },
      category: { type: String, required: true },
      items: [
        { productName: String, quantity: Number, price: Number }
      ],
      totalAmount: Number,
    }.
   tự phần loại "category"
   Nếu không khớp, ghi lỗi vào "note".
    `;

    console.log("Prompt cuối cùng:", finalPrompt);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(finalPrompt);

    let resultText = result.response.text().replace(/```json|\n|```/g, '').trim();

    console.log("Dữ liệu sau khi làm sạch:", resultText);

    // Kiểm tra và parse JSON
    let resultJson;
    try {
      resultJson = JSON.parse(resultText);
    } catch (error) {
      return res.status(500).json({ error: `Lỗi khi phân tích JSON: ${error.message}` });
    }

    // Trả về trường note nếu có
    if (resultJson.note) {
      return res.status(200).json({ note: resultJson.note.trim() });
    }

    // Kiểm tra logic tổng tiền
    const calculatedTotal = resultJson.items.reduce(
      (sum, item) => sum + (item.quantity * item.price),
      0
    );

    if (calculatedTotal !== resultJson.totalAmount) {
      return res.status(200).json({ note: "Tổng tiền không khớp với giá trị các mục trong hóa đơn." });
    }

    const readableText = `
    Loại giao dịch: ${resultJson.type}
    Thể loại: ${resultJson.category}
    Các mặt hàng:
    ${resultJson.items.map(item => `- ${item.productName}: Số lượng ${item.quantity}, Giá ${item.price} VND`).join('\n')}
    Tổng tiền: ${resultJson.totalAmount} VND
    Ngày: ${resultJson.Date}
    `;

    // Lưu kết quả vào database
    const newGeneratedContent = new GeneratedContent({
      prompt: userPrompt,
      result: JSON.stringify(resultJson), // Chuyển result sang chuỗi JSON để lưu
    });

    await newGeneratedContent.save();

    res.status(200).json({
      message: "Vui lòng xác nhận thông tin sau:",
      data: readableText,
    });

  } catch (error) {
    console.error("Lỗi trong quá trình xử lý:", error);
    res.status(500).json({ error: `Lỗi khi xử lý AI: ${error.message}` });
  }
};

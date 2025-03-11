const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connectDB = require("./src/config/database"); // Import hàm kết nối DB

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: "100mb" }));
app.use(cookieParser());
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE", "PATCH"] }));

// Routes
const authRoutes = require("./src/routes/authRoutes");
const transactionRoutes = require("./src/routes/transactionRoutes");
const budgetRoutes = require("./src/routes/budgetRoutes");
const ocrRoutes = require("./src/routes/ocrRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/ocr", ocrRoutes);

// Route mặc định
app.get("/", (_, res) => res.send("Hello World!"));

// Middleware xử lý lỗi
app.use((error, _req, res, _next) => {
  res.status(error.statusCode || 500).json({ message: error.message || "Internal Server Error" });
});

// ✅ Kết nối MongoDB trước khi khởi chạy server
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server is running on http://localhost:${PORT}`));
}).catch((err) => {
  console.error("❌ Server failed to start due to MongoDB connection error:", err.message);
});

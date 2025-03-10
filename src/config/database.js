const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_HOST, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 10000, // Tăng timeout kết nối
      socketTimeoutMS: 45000,  // Tăng timeout socket
    });

    console.log("✅ MongoDB connected successfully!");
  } catch (error) {
    console.error("❌ Error connecting to DB: ", error);
    process.exit(1); // Thoát process nếu kết nối thất bại
  }
};

module.exports = connectDB;

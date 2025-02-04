const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const http = require("http");
const mongoose = require('mongoose');

const connectDB = require("./src/config/database");

// Customer routes
const authRoutes = require("./src/routes/authRoutes");
const transactionRoutes = require("./src/routes/transactionRoutes");
const aiRoutes = require("./src/routes/aiRoutes");

mongoose.set('strictQuery', true); 

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "*",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
};

app.use(cors(corsOptions));

// Customer routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/convertToJson", aiRoutes);


app.get("/", (_, res) => {
  res.send("Hello World!");
});

app.use((error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";
  res.status(statusCode).json({ message });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  connectDB();
});
const express = require("express");
const router = express.Router();
const { generateContent } = require("../controllers/aiService.Controller");

// Route POST để xử lý yêu cầu từ người dùng
router.post("/", generateContent);

module.exports = router;

const express = require("express");
const router = express.Router();
const ocrController = require("../controllers/ocrController");
const { uploadSingle } = require("../Middleware/cloudinary"); // Adjust the path to your Cloudinary config file

// Use Cloudinary upload middleware instead of local disk storage
router.post("/", uploadSingle, ocrController.uploadAndProcessImage);

module.exports = router;
const express = require("express");
const multer = require("multer");
const router = express.Router();
const ocrController = require("../controllers/ocrController");

const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("image"), ocrController.uploadAndProcessImage);

module.exports = router;

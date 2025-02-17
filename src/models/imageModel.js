const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Image", imageSchema);

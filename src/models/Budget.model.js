const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  budget: { type: Number, required: true },
});

module.exports = mongoose.model('Budget', budgetSchema);
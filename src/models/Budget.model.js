const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  weeklyBudget: { type: Number, default: 0 },
  monthlyBudget: { type: Number, default: 0 },
  yearlyBudget: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Tạo compound index cho userId và thời gian
budgetSchema.index({ userId: 1, createdAt: 1 });

module.exports = mongoose.model('Budget', budgetSchema);
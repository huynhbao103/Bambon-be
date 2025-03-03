const Budget = require('../models/Budget.model'); // Giả định bạn có model Budget

const setBudget = async (req, res) => {
  try {
    const { userId, budget } = req.body;
    if (!userId || !budget || budget <= 0) {
      return res.status(400).json({ error: "Thông tin không hợp lệ" });
    }
    let existingBudget = await Budget.findOne({ userId });
    if (existingBudget) {
      existingBudget.budget = budget;
      await existingBudget.save();
    } else {
      existingBudget = new Budget({ userId, budget });
      await existingBudget.save();
    }
    res.status(200).json({ budget: existingBudget.budget });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getBudget = async (req, res) => {
  try {
    const { userId } = req.params;
    const budget = await Budget.findOne({ userId });
    if (!budget) {
      return res.status(200).json({ budget: null });
    }
    res.status(200).json({ budget: budget.budget });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { setBudget, getBudget };
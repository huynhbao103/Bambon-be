const Budget = require('../models/Budget.model'); // Giả định bạn có model Budget

const setBudget = async (req, res) => {
  try {
    const { userId, weeklyBudget, monthlyBudget, yearlyBudget } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "Thiếu thông tin người dùng" });
    }

    // Validate budgets
    if (weeklyBudget < 0 || monthlyBudget < 0 || yearlyBudget < 0) {
      return res.status(400).json({ error: "Ngân sách không thể âm" });
    }

    const budget = await Budget.findOne({ userId });
    
    if (budget) {
      budget.weeklyBudget = weeklyBudget;
      budget.monthlyBudget = monthlyBudget;
      budget.yearlyBudget = yearlyBudget;
      budget.updatedAt = new Date();
      await budget.save();
    } else {
      const newBudget = new Budget({
        userId,
        weeklyBudget,
        monthlyBudget,
        yearlyBudget
      });
      await newBudget.save();
    }

    res.status(200).json({ 
      message: "Cập nhật ngân sách thành công",
      weeklyBudget,
      monthlyBudget,
      yearlyBudget
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getBudget = async (req, res) => {
  try {
    const { userId } = req.params;
    const budget = await Budget.findOne({ userId });
    
    if (!budget) {
      return res.status(200).json({ 
        weeklyBudget: 0,
        monthlyBudget: 0,
        yearlyBudget: 0
      });
    }

    res.status(200).json({
      weeklyBudget: budget.weeklyBudget,
      monthlyBudget: budget.monthlyBudget,
      yearlyBudget: budget.yearlyBudget,
      updatedAt: budget.updatedAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { setBudget, getBudget };
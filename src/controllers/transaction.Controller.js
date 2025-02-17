const Transaction = require('../models/Transaction.models');

const addTransaction = async (req, res) => {
    try {
        const { userId, type, category, amount, items } = req.body;
        const transaction = new Transaction({ userId, type, category, amount,items });
        await transaction.save();
        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getTransactions = async (req, res) => {
    try {
        const { userId } = req.params;
        const transactions = await Transaction.find({ userId });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
 const confirmTransaction = async (req, res) => {
    try {
      const { transactionData } = req.body;
  
      if (!transactionData) {
        return res.status(400).json({ error: "Dữ liệu xác nhận không được để trống." });
      }
  
      // Lưu dữ liệu vào database
      const newTransaction = new Transaction(transactionData);
      await newTransaction.save();
  
      res.status(200).json({ message: "Giao dịch đã được xác nhận và lưu thành công." });
    } catch (error) {
      console.error("Lỗi khi lưu giao dịch:", error);
      res.status(500).json({ error: `Lỗi khi lưu giao dịch: ${error.message}` });
    }
  };
module.exports = { addTransaction, getTransactions, confirmTransaction};

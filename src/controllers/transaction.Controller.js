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

module.exports = { addTransaction, getTransactions };

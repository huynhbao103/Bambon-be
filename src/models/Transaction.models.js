const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    category: { type: String, required: true },
    items: [
        {
            productName: { type: String, required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
        }
    ],  
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);

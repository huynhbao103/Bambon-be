const express = require('express');
const { addTransaction, getTransactions,confirmTransaction,updateTransaction,deleteTransaction } = require('../controllers/transaction.controller.js');
const router = express.Router();

router.post('/', addTransaction);
router.get('/:userId', getTransactions);
router.post('/confirm', confirmTransaction);
router.put('/transactions/:transactionId', updateTransaction); // Sửa giao dịch
router.delete('/transactions/:transactionId', deleteTransaction);


module.exports = router;

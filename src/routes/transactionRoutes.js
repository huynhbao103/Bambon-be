const express = require('express');
const { addTransaction, getTransactions,confirmTransaction,updateTransaction,deleteTransaction } = require('../controllers/transaction.Controller.js');
const router = express.Router();

router.post('/', addTransaction);
router.get('/:userId', getTransactions);
router.post('/confirm', confirmTransaction);
router.put('/:transactionId', updateTransaction); // Sửa giao dịch
router.delete('/:transactionId', deleteTransaction);


module.exports = router;

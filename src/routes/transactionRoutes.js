const express = require('express');
const { addTransaction, getTransactions,confirmTransaction } = require('../controllers/transaction.controller.js');
const router = express.Router();

router.post('/', addTransaction);
router.get('/:userId', getTransactions);
router.post('/confirm', confirmTransaction);


module.exports = router;

const express = require('express');
const { addTransaction, getTransactions } = require('../controllers/transaction.controller.js');
const router = express.Router();

router.post('/', addTransaction);
router.get('/:userId', getTransactions);

module.exports = router;

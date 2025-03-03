const express = require('express');
const router = express.Router();
const { setBudget, getBudget } = require('../controllers/budgetController');

router.post('/', setBudget);
router.get('/:userId', getBudget);

module.exports = router;
import express from 'express';
import {
  createIncome,
  getIncomes,
  getIncomeById,
  getFinancialSummary,
  updateIncomeStatus
} from '../controllers/incomeController.js';
import verifyJWT from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.post('/', verifyJWT, createIncome);
router.get('/', verifyJWT, getIncomes);
router.get('/summary', verifyJWT, getFinancialSummary);
router.get('/:id', verifyJWT, getIncomeById);
router.patch('/:id/status', verifyJWT, updateIncomeStatus);

export default router;
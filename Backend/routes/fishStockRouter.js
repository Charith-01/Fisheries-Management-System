import express from 'express';
import { 
  createFishStock, 
  getAllFishStocks, 
  getFishStockById, 
  updateFishStock 
} from '../controllers/fishStockController.js';

const router = express.Router();

// Create new fish stock
router.post('/', createFishStock);

//  Get all fish stocks
router.get('/', getAllFishStocks);

// Get single fish stock by ID
router.get('/:id', getFishStockById);

// Update fish stock (Admin only)
router.put('/:id', updateFishStock);

export default router;
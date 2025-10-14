import express from 'express';
import { 
  createFishStock, 
  getAllFishStocks, 
  getFishStockById, 
  updateFishStock,
  deleteFishStock,
  getFishStockHistory

} from '../controllers/fishStockController.js';

const router = express.Router();

// Create new fish stock
router.post('/', createFishStock);

// Get all fish stocks
router.get('/', getAllFishStocks);

// Get single fish stock by ID
router.get('/:id', getFishStockById);

// Get update history for a fish stock
router.get('/:id/history', getFishStockHistory);



// Update fish stock (Admin only)
router.post('/:id/update', updateFishStock);

// Delete fish stock (Admin only)
router.delete('/:id', deleteFishStock);

export default router;
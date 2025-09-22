import express from 'express';
import { 
  createReview, 
  getAllReviews, 
  updateReview, 
  deleteReview 
} from '../controllers/reviewController.js';

const router = express.Router();

//  Create new review (Customer only)
router.post('/', createReview);

// Get all reviews (Everyone)
router.get('/', getAllReviews);

//  Update review (Customer can update their own)
router.put('/:id', updateReview);

// Delete review (Customer can delete their own)
router.delete('/:id', deleteReview);

export default router;
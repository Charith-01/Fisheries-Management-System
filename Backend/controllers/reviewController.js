import Review from '../models/review.js';

// Create review - Customer only
export const createReview = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.role) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required. Please login first.' 
      });
    }

    // Check if user is customer
    if (req.user.role !== 'customer') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only customers can create reviews.' 
      });
    }

    const { reviewText, rating } = req.body;

    // Validation
    if (!reviewText || !rating) {
      return res.status(400).json({ 
        success: false, 
        message: 'Review text and rating are required.' 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rating must be between 1 and 5.' 
      });
    }

    // FIX: Use req.user.sub instead of req.user.id
    // Create new review
    const newReview = new Review({
      customerName: `${req.user.firstName} ${req.user.lastName}`,
      reviewText,
      rating,
      customerId: req.user.sub // Use sub instead of id
    });

    const savedReview = await newReview.save();

    res.status(201).json({
      success: true,
      message: 'Review created successfully!',
      data: savedReview
    });

  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while creating review.' 
    });
  }
};

// Get all reviews - Everyone can view
export const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ status: 'active' })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching reviews.' 
    });
  }
};

// Update review - Customer can update their own reviews
export const updateReview = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.role) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required. Please login first.' 
      });
    }

    const { id } = req.params;
    const { reviewText, rating } = req.body;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ 
        success: false, 
        message: 'Review not found.' 
      });
    }

    // FIX: Use req.user.sub instead of req.user.id
    // Check if user is the owner of the review or admin
    if (req.user.role !== 'admin' && review.customerId.toString() !== req.user.sub) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only update your own reviews.' 
      });
    }

    // Update fields
    if (reviewText !== undefined) review.reviewText = reviewText;
    if (rating !== undefined) review.rating = rating;

    const updatedReview = await review.save();

    res.status(200).json({
      success: true,
      message: 'Review updated successfully!',
      data: updatedReview
    });

  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating review.' 
    });
  }
};

// Delete review - Customer can delete their own reviews, Admin can delete any
export const deleteReview = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.role) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required. Please login first.' 
      });
    }

    const { id } = req.params;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ 
        success: false, 
        message: 'Review not found.' 
      });
    }

    // FIX: Use req.user.sub instead of req.user.id
    // Check if user is the owner of the review or admin
    if (req.user.role !== 'admin' && review.customerId.toString() !== req.user.sub) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only delete your own reviews.' 
      });
    }

    await Review.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully!'
    });

  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while deleting review.' 
    });
  }
};
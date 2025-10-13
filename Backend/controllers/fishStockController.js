import FishStock from '../models/fishStock.js';
import mongoose from 'mongoose';

// Create 
export const createFishStock = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.sub;

    if (userRole !== 'admin' && userRole !== 'fisherman') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only Admins and Fishermen can add fish stock.' 
      });
    }

    const { name, type, weight, unit, quality, catchDate, product } = req.body;

    // Required fields
    if (!name || !type || weight == null || !quality) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, type, weight, and quality are required fields.' 
      });
    }

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name must be a non-empty string.'
      });
    }

    if (typeof weight !== 'number' || weight <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Weight must be a positive number.'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user identifier.' 
      });
    }

    // Optional: product must be a valid ObjectId if provided
    let productObjectId = null;
    if (product) {
      if (!mongoose.Types.ObjectId.isValid(product)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product reference.'
        });
      }
      productObjectId = product;
    }

    const newFishStock = new FishStock({
      name: name.trim(),
      type: String(type).trim(),
      weight,
      unit: unit || "kg",
      quality,
      catchDate: catchDate || new Date(),
      addedBy: userId,
      addedByModel: userRole === 'admin' ? 'Admin' : 'Fisherman',
      ...(productObjectId ? { product: productObjectId } : {})
    });

    const savedFishStock = await newFishStock.save();

    res.status(201).json({
      success: true,
      message: 'Fish stock added successfully!',
      data: savedFishStock
    });

  } catch (error) {
    console.error('Error creating fish stock:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error: ' + messages.join(', ') 
      });
    } 
    else if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid data format provided.' 
      });
    } 
    else if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'A fish stock with this identifier already exists.' 
      });
    }
    else if (error.message?.includes('Cannot read properties of null') || error.message?.includes('this.constructor.findOne')) {
      return res.status(500).json({ 
        success: false, 
        message: 'Database error: Unable to generate stock ID. Please try again.' 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Server error while adding fish stock: ' + error.message 
    });
  }
};

// View all
export const getAllFishStocks = async (req, res) => {
  try {
    const userRole = req.user.role;

    if (userRole !== 'admin' && userRole !== 'fisherman') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only Admins and Fishermen can view fish stock.' 
      });
    }

    const fishStocks = await FishStock.find({ isActive: true })
      .populate('addedBy', 'firstName lastName email')
      .populate('product', 'productId name')
      .populate('updateHistory.updatedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: fishStocks.length,
      data: fishStocks
    });

  } catch (error) {
    console.error('Error fetching fish stocks:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching fish stock.' 
    });
  }
};

// View single by ID
export const getFishStockById = async (req, res) => {
  try {
    const userRole = req.user.role;

    if (userRole !== 'admin' && userRole !== 'fisherman') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only Admins and Fishermen can view fish stock.' 
      });
    }

    // Validate ID format first
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid fish stock ID format.' 
      });
    }

    const fishStock = await FishStock.findById(req.params.id)
      .populate('addedBy', 'firstName lastName email')
      .populate('product', 'productId name')
      .populate('updateHistory.updatedBy', 'firstName lastName email');

    if (!fishStock || !fishStock.isActive) {
      return res.status(404).json({ 
        success: false, 
        message: 'Fish stock not found.' 
      });
    }

    res.status(200).json({
      success: true,
      data: fishStock
    });

  } catch (error) {
    console.error('Error fetching fish stock:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid fish stock ID.' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching fish stock.' 
    });
  }
};

export const updateFishStock = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.sub;

    console.log('=== BACKEND UPDATE START ===');
    console.log('Backend - Update request received for ID:', req.params.id);

    if (userRole !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only Admins can update fish stock.' 
      });
    }

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid fish stock ID format.' 
      });
    }

    const { name, type, weight, unit, quality, catchDate, product, updateComment } = req.body;

    // Validate update comment
    if (!updateComment || typeof updateComment !== 'string' || !updateComment.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Update comment is required for tracking changes.'
      });
    }

    // Find existing stock
    const existingStock = await FishStock.findById(req.params.id);
    
    if (!existingStock || !existingStock.isActive) {
      return res.status(404).json({ 
        success: false, 
        message: 'Fish stock not found.' 
      });
    }

    // Prepare update data
    const updateData = {};
    
    // Store previous data as a Map/object
    const previousData = {
      name: existingStock.name,
      type: existingStock.type,
      weight: existingStock.weight,
      unit: existingStock.unit,
      quality: existingStock.quality,
      catchDate: existingStock.catchDate,
      product: existingStock.product
    };

    const newData = {};

    // Validate and prepare changes
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Name must be a non-empty string.'
        });
      }
      updateData.name = name.trim();
      newData.name = name.trim();
    }

    if (type !== undefined) {
      updateData.type = type;
      newData.type = type;
    }

    if (weight !== undefined) {
      const weightNum = parseFloat(weight);
      if (isNaN(weightNum) || weightNum <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Weight must be a positive number.'
        });
      }
      updateData.weight = weightNum;
      newData.weight = weightNum;
    }

    if (unit !== undefined) {
      updateData.unit = unit;
      newData.unit = unit;
    }

    if (quality !== undefined) {
      updateData.quality = quality;
      newData.quality = quality;
    }

    if (catchDate !== undefined) {
      updateData.catchDate = catchDate;
      newData.catchDate = catchDate;
    }

    // Handle product linking/unlinking
    if (product === null) {
      updateData.product = null;
      newData.product = null;
    } else if (product !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(product)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product reference.'
        });
      }
      updateData.product = product;
      newData.product = product;
    }

    // Check if there are actual changes
    const hasChanges = Object.keys(newData).length > 0;
    if (!hasChanges) {
      return res.status(400).json({
        success: false,
        message: 'No changes detected. Please modify at least one field.'
      });
    }

    // Create update history entry - FIXED: Use proper object structure
    const updateEntry = {
      updatedBy: userId,
      updatedByModel: 'Admin',
      updateComment: updateComment.trim(),
      previousData: previousData,
      newData: { ...previousData, ...newData }, // Merge to show complete new state
      updatedAt: new Date()
    };

   

    // Add to update history
    updateData.$push = { updateHistory: updateEntry };

    const updatedFishStock = await FishStock.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('addedBy', 'firstName lastName email')
      .populate('product', 'productId name')
      .populate('updateHistory.updatedBy', 'firstName lastName email');

    if (!updatedFishStock) {
      return res.status(404).json({ 
        success: false, 
        message: 'Fish stock not found after update.' 
      });
    }

   

    res.status(200).json({
      success: true,
      message: 'Fish stock updated successfully!',
      data: updatedFishStock
    });

  } catch (error) {
    console.log('=== BACKEND UPDATE ERROR ===');
    console.error('Error updating fish stock:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error: ' + messages.join(', ') 
      });
    } 
    else if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid data format provided.' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating fish stock: ' + error.message 
    });
  }
};

// Soft delete
export const deleteFishStock = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.sub;

    if (userRole !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only Admins can delete fish stock.' 
      });
    }

    // Validate ID format first
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid fish stock ID format.' 
      });
    }

    const { deleteComment } = req.body;

    if (!deleteComment || typeof deleteComment !== 'string' || !deleteComment.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Delete comment is required.'
      });
    }

    // First get the existing stock to preserve data for history
    const existingStock = await FishStock.findById(req.params.id);
    
    if (!existingStock || !existingStock.isActive) {
      return res.status(404).json({ 
        success: false, 
        message: 'Fish stock not found.' 
      });
    }

    // Create update history entry before deletion
    const deleteHistoryEntry = {
      updatedBy: userId,
      updatedByModel: 'Admin',
      updateComment: `DELETED: ${deleteComment.trim()}`,
      previousData: {
        name: existingStock.name,
        type: existingStock.type,
        weight: existingStock.weight,
        unit: existingStock.unit,
        quality: existingStock.quality,
        catchDate: existingStock.catchDate,
        product: existingStock.product
      },
      newData: {},
      updatedAt: new Date()
    };

    // Perform the soft delete with history
    const deletedFishStock = await FishStock.findByIdAndUpdate(
      req.params.id,
      { 
        isActive: false,
        $push: { updateHistory: deleteHistoryEntry }
      },
      { new: true }
    );

    if (!deletedFishStock) {
      return res.status(404).json({ 
        success: false, 
        message: 'Fish stock not found during deletion.' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Fish stock deleted successfully!'
    });

  } catch (error) {
    console.error('Error deleting fish stock:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid fish stock ID.' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error while deleting fish stock: ' + error.message 
    });
  }
};

// Get update history for a fish stock - COMPLETE FIXED VERSION
export const getFishStockHistory = async (req, res) => {
  try {
    const userRole = req.user.role;

    

    if (userRole !== 'admin' && userRole !== 'fisherman') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only Admins and Fishermen can view fish stock history.' 
      });
    }

    const stockId = req.params.id;
    

    // Validate ID format first
    if (!stockId) {
      console.log('Backend - No ID provided');
      return res.status(400).json({ 
        success: false, 
        message: 'Fish stock ID is required.' 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(stockId)) {
      console.log('Backend - Invalid ID format for history:', stockId);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid fish stock ID format.' 
      });
    }

   
    const fishStock = await FishStock.findById(stockId)
      .populate('updateHistory.updatedBy', 'firstName lastName email')
      .select('updateHistory name stockId isActive');

    
    
    if (!fishStock) {
      console.log('Backend - Stock not found for history');
      return res.status(404).json({ 
        success: false, 
        message: 'Fish stock not found.' 
      });
    }

    if (!fishStock.isActive) {
      console.log('Backend - Stock is not active');
      return res.status(404).json({ 
        success: false, 
        message: 'Fish stock not found.' 
      });
    }



    // Return the history in reverse chronological order (newest first)
    const sortedHistory = fishStock.updateHistory?.sort((a, b) => 
      new Date(b.updatedAt) - new Date(a.updatedAt)
    ) || [];

    res.status(200).json({
      success: true,
      data: sortedHistory,
      stockInfo: {
        name: fishStock.name,
        stockId: fishStock.stockId,
        _id: fishStock._id
      },
      count: sortedHistory.length
    });

  } catch (error) {
    console.error('Error fetching fish stock history:', error);
    console.error('Error stack:', error.stack);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid fish stock ID.' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching fish stock history: ' + error.message 
    });
  }
};
// Add this to your fishStockController.js
export const debugHistoryRoute = async (req, res) => {
  try {
    
    
    // Test if we can find the stock
    const stockId = req.params.id;
 
    
    if (!mongoose.Types.ObjectId.isValid(stockId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid stock ID in debug route' 
      });
    }
    
    const stock = await FishStock.findById(stockId);
    
    
    
  } catch (error) {
    console.error('Debug route error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
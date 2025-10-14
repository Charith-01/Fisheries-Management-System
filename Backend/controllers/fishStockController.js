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
      unit, // default "kg" if undefined
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

// view all
export const getAllFishStocks = async (req, res) => {
  try {
    const userRole = req.user.role;

    if (userRole !== 'admin' && userRole !== 'fisherman') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only Admins and Fishermen can view fish stock.' 
      });
    }

    const fishStocks = await FishStock.find()
      .populate('addedBy', 'firstName lastName email')
      .populate('product', 'productId name') // minimal product info
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

// view single by ID
export const getFishStockById = async (req, res) => {
  try {
    const userRole = req.user.role;

    if (userRole !== 'admin' && userRole !== 'fisherman') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only Admins and Fishermen can view fish stock.' 
      });
    }

    const fishStock = await FishStock.findById(req.params.id)
      .populate('addedBy', 'firstName lastName email')
      .populate('product', 'productId name');

    if (!fishStock) {
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

// Update 
export const updateFishStock = async (req, res) => {
  try {
    const userRole = req.user.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only Admins can update fish stock.' 
      });
    }

    const { name, type, weight, unit, quality, catchDate, product } = req.body;
    const updateData = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Name must be a non-empty string.'
        });
      }
      updateData.name = name.trim();
    }
    if (type !== undefined) updateData.type = type;
    if (weight !== undefined) {
      if (typeof weight !== 'number' || weight <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Weight must be a positive number.'
        });
      }
      updateData.weight = weight;
    }
    if (unit !== undefined) updateData.unit = unit;
    if (quality !== undefined) updateData.quality = quality;
    if (catchDate !== undefined) updateData.catchDate = catchDate;

    // ObjectId-only linking/unlinking
    if (product === null) {
      updateData.product = null; // explicit unlink
    } else if (product !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(product)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product reference.'
        });
      }
      updateData.product = product;
    }

    const updatedFishStock = await FishStock.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('addedBy', 'firstName lastName email')
      .populate('product', 'productId name');

    if (!updatedFishStock) {
      return res.status(404).json({ 
        success: false, 
        message: 'Fish stock not found.' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Fish stock updated successfully!',
      data: updatedFishStock
    });

  } catch (error) {
    console.error('Error updating fish stock:', error);
    
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
        message: 'Invalid fish stock ID.' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating fish stock.' 
    });
  }
};

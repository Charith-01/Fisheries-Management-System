import Income from '../models/income.js';
import Order from '../models/order.js';

// Create income record when payment is successful
export const createIncome = async (req, res) => {
  try {
    const { orderId, stripePaymentId, amount, customerEmail, customerName, items } = req.body;

    // Check if income record already exists
    const existingIncome = await Income.findOne({ orderId });
    if (existingIncome) {
      return res.status(400).json({ message: 'Income record already exists for this order' });
    }

    // Verify the order exists
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Create income record
    const income = new Income({
      orderId,
      stripePaymentId,
      amount,
      currency: 'LKR',
      paymentMethod: 'card',
      status: 'completed',
      customerEmail,
      customerName,
      items,
      description: `Payment for order ${orderId}`
    });

    await income.save();
    
    res.status(201).json({
      message: 'Income record created successfully',
      income
    });
  } catch (error) {
    console.error('Error creating income record:', error);
    res.status(500).json({ message: 'Failed to create income record' });
  }
};

// Get all incomes
export const getIncomes = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    // Date filtering
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const incomes = await Income.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Income.countDocuments(query);
    
    res.json({
      incomes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching incomes:', error);
    res.status(500).json({ message: 'Failed to fetch incomes' });
  }
};

// Get income by ID
export const getIncomeById = async (req, res) => {
  try {
    const income = await Income.findById(req.params.id);
    
    if (!income) {
      return res.status(404).json({ message: 'Income record not found' });
    }
    
    res.json(income);
  } catch (error) {
    console.error('Error fetching income:', error);
    res.status(500).json({ message: 'Failed to fetch income' });
  }
};

// Get financial summary
export const getFinancialSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchStage = {};
    
    if (startDate && endDate) {
      matchStage.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Get total income
    const incomeResult = await Income.aggregate([
      { $match: { ...matchStage, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Get monthly breakdown
    const monthlyBreakdown = await Income.aggregate([
      { $match: { ...matchStage, status: 'completed' } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);
    
    // Get recent transactions
    const recentTransactions = await Income.find({ ...matchStage, status: 'completed' })
      .sort({ date: -1 })
      .limit(5);
    
    res.json({
      totalIncome: incomeResult[0]?.total || 0,
      monthlyBreakdown,
      recentTransactions,
      transactionCount: recentTransactions.length
    });
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({ message: 'Failed to fetch financial summary' });
  }
};

// Update income status (for refunds, etc.)
export const updateIncomeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const income = await Income.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!income) {
      return res.status(404).json({ message: 'Income record not found' });
    }
    
    res.json({
      message: 'Income status updated successfully',
      income
    });
  } catch (error) {
    console.error('Error updating income status:', error);
    res.status(500).json({ message: 'Failed to update income status' });
  }
};
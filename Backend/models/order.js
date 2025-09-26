import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true // Add index for better performance
  },
  email: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },

  // NOTE: your file had two "status" fields; keeping the single canonical one:
  status: {
    type: String,
    enum: [
      'Pending',
      'Paid',
      'Processing',
      'Shipped',
      'Delivered',
      'Cancelled',
      'Payment Failed'
    ],
    default: 'Pending',
    required: true
  },

  billItems: [{
    productId: String,     // public product id (string)
    productName: String,
    image: String,
    quantity: Number,      // assumed in the same unit as FishStock.unit (often "kg")
    price: Number,
    total: Number
  }],

  total: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },

  paymentId: {
    type: String,
    default: null
  },
  paymentStatus: {
    type: String,
    enum: [null, 'pending', 'succeeded', 'failed'],
    default: null
  },
  paymentDate: {
    type: Date,
    default: null
  },
  stripePaymentIntentId: {
    type: String,
    default: null
  },

  // NEW: idempotency flags for stock adjustment
  stockAdjusted: {
    type: Boolean,
    default: false,
    index: true
  },
  stockAdjustedAt: {
    type: Date,
    default: null
  }
},{ timestamps: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;

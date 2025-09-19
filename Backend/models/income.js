import mongoose from 'mongoose';

const incomeSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'LKR'
  },
  paymentMethod: {
    type: String,
    default: 'card'
  },
  stripePaymentId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    default: 'Product sale'
  },
  items: [{
    productId: String,
    productName: String,
    quantity: Number,
    price: Number,
    total: Number
  }]
});

const Income = mongoose.model('Income', incomeSchema);
export default Income;
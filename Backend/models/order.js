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
  status: {
    type: String,
    required: true,
    default: 'Pending'
  },
  phone: {
    type: String,
    required: true
  },
  billItems: [{
    productId: String,
    productName: String,
    image: String,
    quantity: Number,
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
  }
});

// Make sure the collection name is correct
const Order = mongoose.model('Order', orderSchema);
export default Order;
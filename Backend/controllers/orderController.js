import Order from "../models/order.js";
import mongoose from "mongoose";
import Product from "../models/product.js";
import FishStock from "../models/fishStock.js";
import Income from "../models/income.js"
import Notification from "../models/notification.js";

const sendOrderStatusNotification = async (orderId, newStatus, previousStatus) => {
  try {
    // Don't send notifications for these statuses (already handled by payment)
    const excludedStatuses = ['success', 'completed', 'paid', 'pending'];
    if (excludedStatuses.includes(newStatus.toLowerCase())) {
      return;
    }

    // Don't send notification if status didn't actually change
    if (newStatus === previousStatus) {
      return;
    }

    // Get order details
    const order = await Order.findOne({ orderId });
    if (!order) {
      console.log('Order not found for notification');
      return;
    }

    let title = '';
    let message = '';

    // Customize notification based on status
    switch (newStatus.toLowerCase()) {
      case 'refunded':
        title = 'Order Refund Processed';
        message = `Your order ${orderId} has been refunded. Amount: Rs. ${order.total} will be processed shortly.`;
        break;
      case 'delivered':
        title = 'Order Delivered!';
        message = `Your order ${orderId} has been successfully delivered. Thank you for shopping with us!`;
        break;
      case 'shipped':
        title = 'Order Shipped';
        message = `Your order ${orderId} has been shipped and is on its way to you.`;
        break;
      case 'processing':
        title = 'Order Processing';
        message = `Your order ${orderId} is now being processed.`;
        break;
      case 'cancelled':
        title = 'Order Cancelled';
        message = `Your order ${orderId} has been cancelled.`;
        break;
      default:
        title = 'Order Status Updated';
        message = `Your order ${orderId} status has been updated to: ${newStatus}`;
    }

    // Create notification specifically for this customer
    const notification = new Notification({
      title,
      message,
      role: 'customer',
      targetEmails: [order.email], // Send only to the specific customer
      relatedOrder: orderId,
      status: newStatus
    });

    await notification.save();
    console.log(`Order status notification sent for order ${orderId}`);

  } catch (error) {
    console.error('Error sending order status notification:', error);
    // Don't throw error - notification failure shouldn't break order update
  }
};
// --- helper reused locally (light wrapper that calls the one in payment controller would also be fine)
async function decrementStockForOrder(orderDoc) {
  if (!orderDoc || orderDoc.stockAdjusted) return;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const fresh = await Order.findById(orderDoc._id).session(session);
      if (!fresh || fresh.stockAdjusted) return;

      for (const item of fresh.billItems || []) {
        const required = Number(item.quantity || 0);
        if (!required || required <= 0) continue;

        let productDoc = null;
        if (item.productId) {
          productDoc = await Product.findOne({ productId: item.productId }).session(session);
        }

        let query = {};
        if (productDoc?._id) query = { product: productDoc._id };
        else if (item.productName) query = { name: item.productName };
        else continue;

        const rows = await FishStock.find(query).sort({ catchDate: 1, createdAt: 1 }).session(session);

        let remaining = required;
        for (const row of rows) {
          if (remaining <= 0) break;
          const available = Number(row.weight || 0);
          if (available <= 0) continue;

          const take = Math.min(available, remaining);
          await FishStock.updateOne({ _id: row._id }, { $inc: { weight: -take } }, { session });
          remaining -= take;
        }

        if (remaining > 0) {
          console.warn(`Stock shortfall while admin moved status for ${fresh.orderId}: missing ${remaining} of ${item.productName || item.productId}`);
        }
      }

      fresh.stockAdjusted = true;
      fresh.stockAdjustedAt = new Date();
      await fresh.save({ session });
    });
  } finally {
    session.endSession();
  }
}

export async function createOrder(req, res) {
  try {
    console.log("CREATE ORDER - User:", req.user);
    console.log("CREATE ORDER - Request body:", req.body);

    if (!req.user) {
      return res.status(403).json({ message: "You need to log in to continue" });
    }

    const body = req.body;

    if (!body.orderId) {
      return res.status(400).json({ message: "orderId is required" });
    }

    const existingOrder = await Order.findOne({ orderId: body.orderId });
    if (existingOrder) {
      console.log("CREATE ORDER - Order ID already exists:", body.orderId);
      return res.status(400).json({ message: "Order ID already exists" });
    }

    if (!Array.isArray(body.billItems) || body.billItems.length === 0) {
      return res.status(400).json({ message: "billItems are required" });
    }
    if (!Number.isFinite(Number(body.total)) || Number(body.total) <= 0) {
      return res.status(400).json({ message: "Invalid total amount" });
    }

    const orderData = {
      orderId: body.orderId,
      email: req.user.email,
      name: body.name,
      address: body.address,
      phone: body.phone,
      billItems: body.billItems || [],
      total: body.total || 0,
      date: new Date(),
      status: 'Pending',
      paymentStatus: null
    };

    console.log("CREATE ORDER - Saving order:", orderData);

    const order = new Order(orderData);
    const savedOrder = await order.save();

    console.log("CREATE ORDER - Order saved successfully. MongoDB ID:", savedOrder._id);
    console.log("CREATE ORDER - Order ID:", savedOrder.orderId);

    res.json({
      message: "Order created successfully",
      orderId: savedOrder.orderId,
      mongoId: savedOrder._id
    });
  } catch (err) {
    console.error("CREATE ORDER - Error:", err);
    res.status(500).json({
      message: "Order not created",
      error: err.message
    });
  }
}

export async function getOrders(req, res) {
  if (req.user == null) {
    return res.status(403).json({ message: "You need to log in to continue" });
  }

  try {
    if (req.user.role === 'admin') {
      const orders = await Order.find().sort({ createdAt: -1 });
      return res.json(orders);
    } else {
      const orders = await Order.find({ email: req.user.email }).sort({ createdAt: -1 });
      return res.json(orders);
    }
  } catch (err) {
    console.error("GET ORDERS - Error:", err);
    return res.status(500).json({ message: "Error fetching orders" });
  }
}

export async function getOrderById(req, res) {
  try {
    console.log("GET ORDER - Looking for orderId:", req.params.orderId);
    console.log("GET ORDER - Authenticated user:", req.user);

    if (!req.user) {
      return res.status(403).json({ message: "You need to log in to continue" });
    }

    const order = await Order.findOne({ orderId: req.params.orderId });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (req.user.role !== 'admin' && order.email !== req.user.email) {
      return res.status(403).json({ message: "You do not have permission to view this order" });
    }

    res.json(order);
  } catch (err) {
    console.error("GET ORDER - Error:", err);
    res.status(500).json({
      message: "Error fetching order",
      error: err.message
    });
  }
}

export async function updateOrder(req, res) {
  if (req.user == null) {
    return res.status(403).json({ message: "You need to log in to continue" });
  }

  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    if (req.user.role !== 'admin' && order.email !== req.user.email) {
      return res.status(403).json({ message: "You do not have permission to update this order" });
    }

    order.name = req.body.name ?? order.name;
    order.address = req.body.address ?? order.address;
    order.phone = req.body.phone ?? order.phone;

    await order.save();
    res.json({ message: "Order updated successfully" });
  } catch (err) {
    console.error("UPDATE ORDER - Error:", err);
    res.status(500).json({ message: "Order not updated" });
  }
}

export async function updateOrderStatus(req, res) {
  if (req.user == null) {
    return res.status(403).json({ message: "You need to log in to continue" });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "You do not have permission to perform this action" });
  }

  try {
    const nextStatus = req.body.status;
    const allowed = new Set(['Pending','Paid','Processing','Shipped','Delivered','Cancelled','Payment Failed']);
    if (!allowed.has(nextStatus)) {
      return res.status(400).json({ message: "Invalid status" });
    }
     const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const previousStatus = order.status;
    const updated = await Order.findOneAndUpdate(
      { orderId: req.params.orderId },
      { status: nextStatus },
      { new: true }
    );
    

    if (!updated) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Send notification after successful update (non-blocking)
    sendOrderStatusNotification(req.params.orderId, nextStatus, previousStatus).catch(console.error);

    // **NEW**: if admin moves to "Paid" or "Processing" and payment already succeeded,
    // try to decrement stock (idempotent).
    if ((nextStatus === 'Paid' || nextStatus === 'Processing') && updated.paymentStatus === 'succeeded') {
      try {
        await decrementStockForOrder(updated);
      } catch (e) {
        console.error('Stock decrement during status change failed:', e);
      }
    }
    


    res.json({ message: "Order status updated successfully" });
  } catch (err) {
    console.error("STATUS UPDATE - Error:", err);
    res.status(500).json({ message: "Order status not updated" });
  }
}

export async function cancelOrder(req, res) {
  if (req.user == null) {
    return res.status(403).json({ message: "You need to log in to continue" });
  }

  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (req.user.role !== 'admin' && order.email !== req.user.email) {
      return res.status(403).json({ message: "You do not have permission to cancel this order" });
    }

    if (order.status !== 'Pending') {
      return res.status(400).json({ message: "Only pending orders can be cancelled" });
    }

    order.status = 'Cancelled';
    await order.save();

    res.json({ message: "Order cancelled successfully" });
  } catch (err) {
    console.error("CANCEL ORDER - Error:", err);
    res.status(500).json({ message: "Order not cancelled" });
  }
}

export async function deleteOrder(req, res) {
  if (req.user == null) {
    return res.status(403).json({ message: "You need to log in to continue" });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "You do not have permission to perform this action" });
  }

  try {
    const result = await Order.findOneAndDelete({ orderId: req.params.orderId });
    if (!result) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error("DELETE ORDER - Error:", err);
    res.status(500).json({ message: "Order not deleted" });
  }
}
export const refundOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }

    if (order.paymentStatus !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Cannot refund order with unsuccessful payment'
      });
    }

    if (order.status === 'refunded') {
      return res.status(400).json({
        success: false,
        message: 'Order is already refunded'
      });
    }

    const previousStatus = order.status; // Get previous status

    // Create UNIQUE order ID for refund record
    const refundOrderId = `${order.orderId}_REFUND_${Date.now()}`;
    
    // Create refund record
    const refundRecord = new Income({
      orderId: refundOrderId,
      originalOrderId: order.orderId,
      customerName: order.name,
      customerEmail: order.email,
      amount: -order.total,
      paymentMethod: order.paymentMethod || 'card',
      status: 'refunded',
      date: new Date(),
      items: order.billItems,
      type: 'refund',
      originalOrderDate: order.date,
      stripePaymentId: order.stripePaymentId || order.paymentId || `refund_${order.orderId}`
    });

    order.status = status;
    order.refundedAt = new Date();

    await refundRecord.save();
    await order.save();

    // Send notification
    sendOrderStatusNotification(orderId, status, previousStatus).catch(console.error);

    res.json({ 
      success: true,
      message: 'Order refunded successfully', 
      order,
      refundRecord 
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during refund process' 
    });
  }
};
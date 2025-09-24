import Order from "../models/order.js";

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

    const updated = await Order.findOneAndUpdate(
      { orderId: req.params.orderId },
      { status: nextStatus },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Order not found" });
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

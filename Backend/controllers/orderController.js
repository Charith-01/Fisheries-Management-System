import Order from "../models/order.js";

export async function createOrder(req, res) {
  try {
    console.log("CREATE ORDER - User:", req.user);
    console.log("CREATE ORDER - Request body:", req.body);

    if (!req.user) {
      return res.status(403).json({
        message: "You need to log in to continue"
      });
    }

    const body = req.body;
    
    // Check if order already exists
    const existingOrder = await Order.findOne({ orderId: body.orderId });
    if (existingOrder) {
      console.log("CREATE ORDER - Order ID already exists:", body.orderId);
      return res.status(400).json({
        message: "Order ID already exists"
      });
    }

    const orderData = {
      orderId: body.orderId,
      email: req.user.email, // Use authenticated user's email
      name: body.name,
      address: body.address,
      phone: body.phone,
      billItems: body.billItems || [],
      total: body.total || 0,
      date: new Date()
    };

    console.log("CREATE ORDER - Saving order:", orderData);

    const order = new Order(orderData);
    const savedOrder = await order.save();
    
    console.log("CREATE ORDER - Order saved successfully. MongoDB ID:", savedOrder._id);
    console.log("CREATE ORDER - Order ID:", savedOrder.orderId);
    
    // Verify the order was actually saved
    const verifyOrder = await Order.findOne({ orderId: body.orderId });
    console.log("CREATE ORDER - Verification find result:", verifyOrder);

    res.json({
      message: "Order created successfully",
      orderId: body.orderId,
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

export async function getOrders(req, res){
    if(req.user == null){
        res.status(403).json({
            message : "You need to log in to continue"
        })
        return;
    }

    if(req.user.role == 'admin'){
        try {
            const orders = await Order.find();
            res.json(orders);
        } catch (err) {
            res.status(500).json({
                message : "Error fetching orders"
            })
        }
    }
    else{
        try {
            const orders = await Order.find({
                email : req.user.email
            });
            res.json(orders);
        } catch (err) {
            res.status(500).json({
                message : "Error fetching orders"
            })
        }
    }
}

export async function getOrderById(req, res) {
  try {
    console.log("GET ORDER - Looking for orderId:", req.params.orderId);
    console.log("GET ORDER - Authenticated user:", req.user);

    if (!req.user) {
      return res.status(403).json({
        message: "You need to log in to continue"
      });
    }

    // Try different query approaches
    const order = await Order.findOne({ orderId: req.params.orderId });
    console.log("GET ORDER - Find result:", order);

    if (!order) {
      // Try alternative queries for debugging
      console.log("GET ORDER - Trying alternative queries...");
      
      // Query by MongoDB _id
      const allOrders = await Order.find({}).limit(5);
      console.log("GET ORDER - First 5 orders in DB:", allOrders);
      
      // Try case-insensitive search
      const caseInsensitiveOrder = await Order.findOne({ 
        orderId: { $regex: new RegExp(`^${req.params.orderId}$`, 'i') } 
      });
      console.log("GET ORDER - Case insensitive result:", caseInsensitiveOrder);

      return res.status(404).json({ message: "Order not found" });
    }

    console.log("GET ORDER - Order found. Order email:", order.email, "User email:", req.user.email);

    // Check if user has permission to view this order
    if (req.user.role !== 'admin' && order.email !== req.user.email) {
      return res.status(403).json({ 
        message: "You do not have permission to view this order" 
      });
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

export async function updateOrder(req, res){
    if(req.user == null){
        res.status(403).json({
            message : "You need to log in to continue"
        })
        return;
    }

    try{
        const order = await Order.findOne({ orderId: req.params.orderId });
        if(!order){
            res.status(404).json({ message: "Order not found" });
            return;
        }

        if(order.email !== req.user.email){
            res.status(403).json({ message: "You do not have permission to update this order" });
            return;
        }

        order.name = req.body.name ?? order.name;
        order.address = req.body.address ?? order.address;
        order.phone = req.body.phone ?? order.phone;

        await order.save();
        res.json({ message: "Order updated successfully" });
    } catch(err){
        res.status(500).json({ message: "Order not updated" });
    }
}

export async function updateOrderStatus(req, res){
    if(req.user == null){
        res.status(403).json({
            message : "You need to log in to continue"
        })
        return;
    }

    if(req.user.role != 'admin'){
        res.status(403).json({
            message : "You do not have permission to perform this action"
        })
        return;
    }

    try{
        const updated = await Order.findOneAndUpdate(
            { orderId: req.params.orderId },
            { status: req.body.status },
            { new: true }
        );

        if(!updated){
            res.status(404).json({ message: "Order not found" });
            return;
        }

        res.json({ message: "Order status updated successfully" });
    } catch(err){
        res.status(500).json({ message: "Order status not updated" });
    }
}

export async function cancelOrder(req, res){
    if(req.user == null){
        res.status(403).json({
            message : "You need to log in to continue"
        })
        return;
    }

    try{
        const order = await Order.findOne({ orderId: req.params.orderId });
        if(!order){
            res.status(404).json({ message: "Order not found" });
            return;
        }

        if(order.email !== req.user.email){
            res.status(403).json({ message: "You do not have permission to cancel this order" });
            return;
        }

        if(order.status !== 'Pending'){
            res.status(400).json({ message: "Only pending orders can be cancelled" });
            return;
        }

        order.status = 'Cancelled';
        await order.save();

        res.json({ message: "Order cancelled successfully" });
    } catch(err){
        res.status(500).json({ message: "Order not cancelled" });
    }
}

export async function deleteOrder(req, res){
    if(req.user == null){
        res.status(403).json({
            message : "You need to log in to continue"
        })
        return;
    }

    if(req.user.role != 'admin'){
        res.status(403).json({
            message : "You do not have permission to perform this action"
        })
        return;
    }

    try{
        const result = await Order.findOneAndDelete({ orderId: req.params.orderId });
        if(!result){
            res.status(404).json({ message: "Order not found" });
            return;
        }

        res.json({ message: "Order deleted successfully" });
    } catch(err){
        res.status(500).json({ message: "Order not deleted" });
    }
}





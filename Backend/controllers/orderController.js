import Order from "../models/order.js";

export async function createOrder(req, res) {

    if(req.user == null){
        res.status(403).json({
            message : "You need to log in to continue"
        })
        return;
    }

    const body = req.body;
    const orderData = {
        orderId : "",
        email : req.user.email,
        name : body.name,
        address : body.address,
        phone : body.phone,
        billItems : [],
        total : 0
    }

    const lastBills = await Order.find().sort({
        date : -1
    }).limit(1);

    if(lastBills.length == 0){
        orderData.orderId = "ORD0001";
    }
    else{
        const lastBill = lastBills[0]; // Get the last bill

        const lastOrderId = lastBill.orderId; //ORD0001
        const lastOrderNumber = lastOrderId.replace("ORD",""); //0001
        const lastOrderNumberInt = parseInt(lastOrderNumber); //1
        const newOrderNumberInt = lastOrderNumberInt + 1; //2
        const newOrderNumberStr = newOrderNumberInt.toString().padStart(4, '0'); //0002
        orderData.orderId = "ORD" + newOrderNumberStr; //ORD0002
    }

    for(let i=0; i<body.billItems.length; i++){
        const billItems = body.billItems[i];

        //check if product exists
    }

    const order = new Order(orderData);

    try{
        await order.save();
        res.json({
            message : "Order created successfully"
        });
    } catch(err){
        console.error("Error saving order:", err);
        res.status(500).json({
            message : "Order not created"
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

export async function getOrderById(req, res){
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

        if(req.user.role !== 'admin' && order.email !== req.user.email){
            res.status(403).json({ message: "You do not have permission to view this order" });
            return;
        }

        res.json(order);
    } catch(err){
        res.status(500).json({ message: "Error fetching order" });
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





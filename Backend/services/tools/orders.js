import Order from "../../models/order.js";

/** Only return orders for this user (by email). */
export async function getMyOrders({ user, status, limit = 10, page = 1 }) {
  if (!user?.email) throw new Error("Not authenticated");
  const find = { email: user.email };
  if (status) find.status = status;

  const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
  const rows = await Order.find(find).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

  return rows.map(o => ({
    orderId: o.orderId,
    date: o.date,
    status: o.status,
    total: o.total,
    items: (o.billItems || []).map(i => ({
      name: i.productName,
      qty: i.quantity,
      price: i.price
    }))
  }));
}

/** Validate ownership (or admin) and return one order. */
export async function getOrderById({ user, orderId }) {
  if (!user?.email) throw new Error("Not authenticated");
  const o = await Order.findOne({ orderId }).lean();
  if (!o) return null;
  if (user.role !== "admin" && o.email !== user.email) throw new Error("Forbidden");
  return {
    orderId: o.orderId,
    date: o.date,
    status: o.status,
    total: o.total,
    items: (o.billItems || []).map(i => ({
      name: i.productName,
      qty: i.quantity,
      price: i.price
    }))
  };
}

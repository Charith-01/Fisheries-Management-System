import api from "./axios";

// Create new order
export const createOrder = async (data) => {
  const res = await api.post("/order/create", data);
  return res.data;
};

// Get all orders (admin → all, customer → own)
export const getOrders = async () => {
  const res = await api.get("/order/all");
  return res.data;
};

// Get single order by ID
export const getOrderById = async (orderId) => {
  const res = await api.get(`/order/${orderId}`);
  return res.data;
};

// Update order (customer: address/phone/name)
export const updateOrder = async (orderId, updates) => {
  const res = await api.put(`/order/update/${orderId}`, updates);
  return res.data;
};

// Update order status (admin only)
export const updateOrderStatus = async (orderId, status) => {
  const res = await api.put(`/order/status/${orderId}`, { status });
  return res.data;
};

// Cancel order
export const cancelOrder = async (orderId) => {
  const res = await api.post(`/order/cancel/${orderId}`);
  return res.data;
};

// Delete order (admin only)
export const deleteOrder = async (orderId) => {
  const res = await api.delete(`/order/delete/${orderId}`);
  return res.data;
};

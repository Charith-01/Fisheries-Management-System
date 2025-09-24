import axios from "axios";

const API_URL =
  (import.meta.env.VITE_BACKEND_URL || "http://localhost:3000") +
  "/api/fishstock";

const api = axios.create({
  baseURL: API_URL,
});

// 🔑 Attach token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const fishStockService = {
  /**
   * Create a new Fish Stock
   * @param {Object} fishStockData
   * Supports optional linking:
   *  - product: "<Mongo ObjectId>" (Product._id) ✅ recommended
   *  - (legacy fallback) productId: "PRD0007" if backend still accepts codes
   */
  createFishStock: async (fishStockData) => {
    try {
      const response = await api.post("/", fishStockData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "An error occurred" };
    }
  },

  /**
   * Get all Fish Stocks
   * Returns { success, count, data }
   */
  getAllFishStocks: async () => {
    try {
      const response = await api.get("/");
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "An error occurred" };
    }
  },

  /**
   * Get a Fish Stock by ID
   * @param {string} id - FishStock._id
   * Returns { success, data }
   */
  getFishStockById: async (id) => {
    try {
      const response = await api.get(`/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "An error occurred" };
    }
  },

  /**
   * Update an existing Fish Stock
   * @param {string} id - FishStock._id
   * @param {Object} updateData
   * Supports same linking fields as createFishStock
   */
  updateFishStock: async (id, updateData) => {
    try {
      const response = await api.put(`/${id}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "An error occurred" };
    }
  },
};

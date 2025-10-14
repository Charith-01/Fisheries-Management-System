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
   * Update an existing Fish Stock with comment
   * @param {string} id - FishStock._id
   * @param {Object} updateData - Must include updateComment field
   * @param {string} updateData.updateComment - Reason for the update (required)
   * Supports same linking fields as createFishStock
   */
updateFishStock: async (id, updateData) => {
  try {
    console.log('=== FRONTEND UPDATE REQUEST ===');
    console.log('Frontend - Updating fish stock with ID:', id);
    
    // Temporary change - use POST instead of PUT
    const response = await api.post(`/${id}/update`, updateData);
    
    console.log('=== FRONTEND UPDATE SUCCESS ===');
    return response.data;
  } catch (error) {
    console.log('=== FRONTEND UPDATE ERROR ===');
    console.error('Frontend - Update error:', error);
    throw error.response?.data || { message: "An error occurred" };
  }
},

  /**
   * Soft delete a Fish Stock with comment
   * @param {string} id - FishStock._id
   * @param {string} deleteComment - Reason for deletion (required)
   */
  deleteFishStock: async (id, deleteComment) => {
    try {
      const response = await api.delete(`/${id}`, {
        data: { deleteComment }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "An error occurred" };
    }
  },

  /**
   * Get update history for a specific Fish Stock
   * @param {string} id - FishStock._id
   */
getUpdateHistory: async (id) => {
  try {
    console.log('=== FRONTEND HISTORY REQUEST ===');
    console.log('Frontend - Fetching update history for ID:', id);
    console.log('Frontend - Full URL:', `${API_URL}/${id}/history`);
    
    const response = await api.get(`/${id}/history`);
    
    console.log('=== FRONTEND HISTORY SUCCESS ===');
    console.log('Frontend - History response:', response.data);
    
    return response.data;
  } catch (error) {
    console.log('=== FRONTEND HISTORY ERROR ===');
    console.error('Frontend - Error fetching history:', error);
    console.error('Frontend - Error status:', error.response?.status);
    console.error('Frontend - Error data:', error.response?.data);
    console.error('Frontend - Error config:', error.config);
    
    throw error.response?.data || { message: "An error occurred" };
  }
},

  /**
   * Get only active fish stocks
   */
  getActiveFishStocks: async () => {
    try {
      const response = await api.get("/?active=true");
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "An error occurred" };
    }
  },

  /**
   * Get fish stocks by type
   * @param {string} type - fish, crab, shellfish, prawn, lobster, squid, other
   */
  getFishStocksByType: async (type) => {
    try {
      const response = await api.get(`/?type=${type}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "An error occurred" };
    }
  },

  /**
   * Get fish stocks by quality
   * @param {string} quality - Premium, Grade A, Grade B, Grade C
   */
  getFishStocksByQuality: async (quality) => {
    try {
      const response = await api.get(`/?quality=${quality}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "An error occurred" };
    }
  },

  /**
   * Get fish stocks within date range
   * @param {string} startDate - ISO date string
   * @param {string} endDate - ISO date string
   */
  getFishStocksByDateRange: async (startDate, endDate) => {
    try {
      const response = await api.get(`/?startDate=${startDate}&endDate=${endDate}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "An error occurred" };
    }
  }
};
import axios from "axios";

const API_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:3000") + "/api/fishstock";

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const fishStockService = {
    createFishStock: async (fishStockData) => {
        try {
            const response = await api.post("/", fishStockData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: "An error occurred" };
        }
    },

    getAllFishStocks: async () => {
        try {
            const response = await api.get("/");
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: "An error occurred" };
        }
    },

    getFishStockById: async (id) => {
        try {
            const response = await api.get(`/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: "An error occurred" };
        }
    },

    updateFishStock: async (id, updateData) => {
        try {
            const response = await api.put(`/${id}`, updateData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: "An error occurred" };
        }
    }
};
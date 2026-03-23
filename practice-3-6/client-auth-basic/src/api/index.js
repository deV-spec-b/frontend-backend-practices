import axios from "axios";

const API_URL = "http://localhost:3002/api";

const apiClient = axios.create({
    baseURL: API_URL,
    headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const api = {
    register: (data) => apiClient.post("/auth/register", data),
    login: (data) => apiClient.post("/auth/login", data),
    getMe: () => apiClient.get("/auth/me"),
    
    // Products
    getProducts: () => apiClient.get("/products"),
    getProduct: (id) => apiClient.get(`/products/${id}`),
    createProduct: (data) => apiClient.post("/products", data),
    updateProduct: (id, data) => apiClient.put(`/products/${id}`, data),
    deleteProduct: (id) => apiClient.delete(`/products/${id}`),
    
    // Users (admin only)
    getUsers: () => apiClient.get("/users"),
    getUser: (id) => apiClient.get(`/users/${id}`),
    updateUser: (id, data) => apiClient.put(`/users/${id}`, data),
    deleteUser: (id) => apiClient.delete(`/users/${id}`),
};
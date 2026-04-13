import axios from "axios";

const API_URL = "http://localhost:3000/api";

const apiClient = axios.create({
    baseURL: API_URL,
    headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

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

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(token => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return apiClient(originalRequest);
                    })
                    .catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem("refreshToken");

            if (!refreshToken) {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("user");
                window.location.href = "/login";
                return Promise.reject(error);
            }

            try {
                const response = await axios.post(`${API_URL}/auth/refresh`, {
                    refreshToken,
                });

                const { accessToken, refreshToken: newRefreshToken } = response.data;

                localStorage.setItem("accessToken", accessToken);
                localStorage.setItem("refreshToken", newRefreshToken);

                processQueue(null, accessToken);
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("user");
                window.location.href = "/login";
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export const auth = {
    register: (data) => apiClient.post("/auth/register", data),
    login: (data) => apiClient.post("/auth/login", data),
    getMe: () => apiClient.get("/auth/me"),
};

export const users = {
    getAll: () => apiClient.get("/users"),
    getById: (id) => apiClient.get(`/users/${id}`),
    update: (id, data) => apiClient.put(`/users/${id}`, data),
    delete: (id) => apiClient.delete(`/users/${id}`),
};

export const products = {
    getAll: () => apiClient.get("/products"),
    getById: (id) => apiClient.get(`/products/${id}`),
    create: (data) => apiClient.post("/products", data),
    update: (id, data) => apiClient.put(`/products/${id}`, data),
    delete: (id) => apiClient.delete(`/products/${id}`),
};

export default apiClient;
import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_REACT_APP_API_URL || // fallback si défini avec un autre nom
  "";

const api = axios.create({
  baseURL,
});

// simple interceptor pour ajouter le token si présent
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || "";
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getUsersRequest = (opts) => api.get("/api/users", { params: opts });
export const updateUserRoleRequest = (userId, role) =>
  api.put(`/users/update-role`, { userId, role });
export const getUserRequest = (id) => api.get(`/users/${id}`);
export const createUserRequest = (payload) => api.post("/users", payload);
export const updateUserRequest = (id, payload) => api.put(`/users/${id}`, payload);
export const deleteUserRequest = (id) => api.delete(`/users/${id}`);

export default api;

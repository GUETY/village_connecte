import API from "./axiosConfig.js";
export const loginRequest = (payload) => API.post("/auth/login", payload);
export const registerRequest = (payload) => API.post("/auth/register", payload);
export const forgotPasswordRequest = (payload) => API.post("/auth/forgot-password", payload);
export const resetPasswordRequest = (payload) => API.post("/auth/reset-password", payload);

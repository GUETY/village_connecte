import axios from "axios";
import { sanitizeHtml } from "../utils/sanitize";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://api.villageconnecte.voisilab.online/api",
  headers: { "Content-Type": "application/json" },
});

// inject token if exists
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || localStorage.getItem("village_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Optional: sanitize HTML-like fields in responses to avoid XSS when rendering
API.interceptors.response.use(
  (response) => {
    try {
      const data = response?.data;
      if (!data) return response;

      const sanitizeObject = (obj) => {
        if (!obj || typeof obj !== "object") return obj;
        for (const k of Object.keys(obj)) {
          const v = obj[k];
          if (v && typeof v === "string") {
            // common field names that may contain HTML
            if (/description|content|html|body|message/i.test(k)) {
              obj[k] = sanitizeHtml(v);
            }
          } else if (Array.isArray(v)) {
            obj[k] = v.map((item) => (typeof item === "object" ? sanitizeObject(item) : item));
          } else if (typeof v === "object") {
            obj[k] = sanitizeObject(v);
          }
        }
        return obj;
      };

      // sanitize top-level data
      if (typeof data === "object") sanitizeObject(data);
    } catch (err) {
      // don't break app on sanitizer errors
      console.warn("Response sanitization failed:", err);
    }
    return response;
  },
  (error) => Promise.reject(error)
);

export default API;

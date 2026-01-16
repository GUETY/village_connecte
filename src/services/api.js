import axios from "axios";

// Récupère et normalise la variable d'environnement VITE_API_BASE_URL
function normalizeBaseUrl(raw) {
  if (!raw) return "";
  const s = String(raw).trim();
  // retirer slash final
  return s.replace(/\/+$/, "");
}

const envRaw = import.meta.env.VITE_API_BASE_URL;
const envBase = normalizeBaseUrl(envRaw);

// Utiliser l'API en ligne par défaut si aucune variable d'env valide ou si elle vaut "/api"
const defaultBase = "https://api.villageconnecte.voisilab.online/api";
const baseURL = (envBase && envBase !== "/api") ? envBase : defaultBase;

// Debug : affiche la base utilisée
console.debug("[api] baseURL =", baseURL);

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

// AJOUT : Récupérer le token CSRF si disponible
const getCsrfToken = () => {
  const token = document.querySelector('meta[name="csrf-token"]')?.content;
  return token || localStorage.getItem("csrf_token") || "";
};

// Intercepteur pour ajouter le token CSRF
api.interceptors.request.use((config) => {
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    config.headers["X-CSRF-Token"] = csrfToken;
  }
  return config;
});

// Définit/retire le token d'Authorization pour axios et stocke en localStorage
export function setAuthToken(token) {
  try {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("village_token", token);
    } else {
      delete api.defaults.headers.common["Authorization"];
      localStorage.removeItem("village_token");
    }
  } catch (err) {
    console.error("[api] setAuthToken error", err);
  }
}

api.interceptors.request.use(
  (req) => {
    // s'assurer que le token présent en localStorage est toujours appliqué
    const t = localStorage.getItem("village_token");
    if (t && !req.headers?.Authorization) {
      req.headers = req.headers || {};
      req.headers.Authorization = `Bearer ${t}`;
    }
    return req;
  },
  (err) => Promise.reject(err)
);

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const response = err?.response || err;
    console.error("[api] response error", response);

    try {
      const status = response?.status;
      const originalRequest = err?.config;

      // If unauthorized, try to refresh the token once, then retry the request
      if ((status === 401 || status === 403) && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          // Attempt refresh token endpoint
          const refreshRes = await api.post('/auth/refresh');
          const refreshData = refreshRes?.data ?? refreshRes ?? null;

          // Extract token from response in multiple possible shapes
          const newToken = refreshData?.token || refreshData?.access_token || refreshData?.data?.token || refreshData?.data?.access_token || null;

          if (newToken) {
            // Apply new token and retry original request
            setAuthToken(newToken);
            // ensure Authorization header on the original request
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          console.warn('[api] token refresh failed', refreshErr);
          // fallthrough to logout/redirect
        }
      }

      // If we get here, no refresh possible or already retried — clear auth and redirect
      if (status === 401 || status === 403) {
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('village_token');
            localStorage.removeItem('token');
            localStorage.removeItem('userLogin');
          }
        } catch (e) {}
        try { delete api.defaults.headers.common['Authorization']; } catch (e) {}
        if (typeof window !== 'undefined') window.location.href = '/';
      }
    } catch (e) {
      console.error('[api] response interceptor error', e);
    }

    return Promise.reject(response);
  }
);

export const agentsAPI = {
  list: (params) => api.get("/agents", { params }).then(r => r.data),
  get: (id) => api.get(`/agents/${id}`).then(r => r.data),
  create: (payload) => api.post("/agents", payload).then(r => r.data),
  // IMPORTANT : ne pas fixer 'Content-Type' manuellement pour FormData
  // laisser axios/browser ajouter la boundary
  createMultipart: (formData) =>
    api.post("/agents", formData).then(r => r.data),
  update: (id, payload) => api.put(`/agents/${id}`, payload).then(r => r.data),
  remove: (id) => api.delete(`/agents/${id}`).then(r => r.data),
};

// --- Nouvel export : API Users (liste des utilisateurs connectés) ---
export const usersAPI = {
  list: (params) => api.get("/users", { params }).then(r => r.data),
  get: (id) => api.get(`/users/${id}`).then(r => r.data),
  create: (payload) => api.post("/users", payload).then(r => r.data),
  update: (id, payload) => api.put(`/users/${id}`, payload).then(r => r.data),
  remove: (id) => api.delete(`/users/${id}`).then(r => r.data),
};

export const forfaitAPI = {
  list: (params) => api.get("/forfaits", { params }).then(r => r.data),
  get: (id) => api.get(`/forfaits/${id}`).then(r => r.data),
  create: (payload) => api.post("/forfaits", payload).then(r => r.data),
  update: (id, payload) => api.put(`/forfaits/${id}`, payload).then(r => r.data),
  remove: (id) => api.delete(`/forfaits/${id}`).then(r => r.data),
};

// helper réutilisable pour POST avec endpoints alternatifs
async function postWithFallback(paths, payload) {
  let lastError = null;
  for (const path of paths) {
    try {
      const res = await api.post(path, payload);
      return res.data;
    } catch (err) {
      const status = err?.response?.status;
      if (status && status !== 404) throw err?.response || err;
      lastError = err;
    }
  }
  // fallback : essayer base sans /api
  try {
    const base = String(api.defaults.baseURL || "").replace(/\/api\/?$/i, "");
    if (base) {
      const full = `${base}${paths[0].startsWith("/") ? "" : "/"}${paths[0].replace(/^\/+/, "")}`;
      const res = await axios.post(full, payload, {
        headers: api.defaults.headers,
        timeout: api.defaults.timeout,
      });
      return res.data;
    }
  } catch (err) {
    lastError = err;
  }
  const e = lastError?.response || lastError || new Error("Aucune route disponible pour POST");
  console.error("[api] postWithFallback failed - tried:", paths, "baseFallback:", api.defaults.baseURL, e);
  return Promise.reject(e);
}

// --- Ajout / modification : API Codes (create priorise /codes/generate) ---
export const codesAPI = {
  list: (params) => api.get("/codes", { params }).then(r => r.data),
  get: (id) => api.get(`/codes/${id}`).then(r => r.data),
  // ici on force d'abord la route /codes/generate (backend fourni)
  create: (payload) => postWithFallback([
    "/codes/generate",  // <-- route prioritaire fournie
    "/codes", 
    "/code", 
    "/api/codes", 
    "/v1/codes"
  ], payload),
  update: (id, payload) => api.put(`/codes/${id}`, payload).then(r => r.data),
  remove: (id) => api.delete(`/codes/${id}`).then(r => r.data),
};

// --- Exports API Transactions (conforme au schéma Mongoose Transaction) ---
export const transactionsAPI = {
  list: (params) => api.get("/transactions", { params }).then(r => r.data),
  get: (id) => api.get(`/transactions/${id}`).then(r => r.data),
  create: (payload) => api.post("/transactions", payload).then(r => r.data),
  update: (id, payload) => api.put(`/transactions/${id}`, payload).then(r => r.data),
  remove: (id) => api.delete(`/transactions/${id}`).then(r => r.data),
};

// --- Exports API Statistiques (conforme au schéma Mongoose Statistique) ---
export const statistiquesAPI = {
  list: (params) => api.get("/statistiques", { params }).then(r => r.data),
  get: (id) => api.get(`/statistiques/${id}`).then(r => r.data),
  create: (payload) => api.post("/statistiques", payload).then(r => r.data),
  update: (id, payload) => api.put(`/statistiques/${id}`, payload).then(r => r.data),
  remove: (id) => api.delete(`/statistiques/${id}`).then(r => r.data),
};

// --- Nouvel export : API Authentification ---
export const authAPI = {
  login: (payload) => api.post("/auth/login", payload).then(r => r.data),
  loginFallback: (payload) => api.post("/login", payload).then(r => r.data),
  logout: () => api.post("/auth/logout").then(r => r.data),
  refresh: () => api.post("/auth/refresh").then(r => r.data),
  me: () => api.get("/auth/me").then(r => r.data),
};

// --- Nouvel export : API alertes (conforme au schéma Mongoose fourni) ---
export const alertesAPI = {
  list: (params) => api.get("/alertes", { params }).then(r => r.data),
  get: (id) => api.get(`/alertes/${id}`).then(r => r.data),
  create: (payload) => api.post("/alertes", payload).then(r => r.data),
  update: (id, payload) => api.patch(`/alertes/${id}`, payload).then(r => r.data),
  remove: (id) => api.delete(`/alertes/${id}`).then(r => r.data),
};

// --- Nouvel export : API Bornes (conforme au schéma Mongoose fourni) ---
export const bornesAPI = {
  list: (params) => api.get("/bornes", { params }).then(r => r.data),
  
  get: (id) => api.get(`/bornes/${id}`).then(r => r.data),
  
  create: (payload) => api.post("/bornes", payload).then(r => r.data),
  
  update: (id, payload) => api.put(`/bornes/${id}`, payload).then(r => r.data),
  
  remove: (id) => api.delete(`/bornes/${id}`).then(r => r.data),
};

// À ajouter dans src/services/api.js
export const accessRulesAPI = {
  list: (params) => api.get("/access-rules", { params }).then(r => r.data),
  save: (payload) => api.post("/access-rules", payload).then(r => r.data),
};

// --- Nouvel export : API Groupes ---
export const groupsAPI = {
  list: (params) => api.get("/groups", { params }).then(r => r.data),
  get: (id) => api.get(`/groups/${id}`).then(r => r.data),
  create: (payload) => api.post("/groups", payload).then(r => r.data),
  update: (id, payload) => api.put(`/groups/${id}`, payload).then(r => r.data),
  remove: (id) => api.delete(`/groups/${id}`).then(r => r.data),
};

export default api;
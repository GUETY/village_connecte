"use strict";
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

/**
 * AuthProvider — fournit { user, users, token, login, logout } via contexte.
 * Named export AuthProvider attendu par main.jsx
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem("token") || null;
    } catch (e) {
      return null;
    }
  });
  const [role, setRole] = useState(() => {
    try {
      // Preferer l'objet utilisateur stocké (village_user)
      const storedUser = localStorage.getItem("village_user");
      if (storedUser) {
        const u = JSON.parse(storedUser);
        if (u && typeof u.role === "string") return u.role;
      }
      // Sinon tenter de décoder le token stocké (village_token)
      const t = localStorage.getItem("village_token");
      if (t && typeof t === "string" && t.includes(".")) {
        try {
          const payload = t.split(".")[1];
          const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
          if (decoded && typeof decoded.role === "string") return decoded.role;
        } catch (e) {
          // ignore decode errors
        }
      }
    } catch (e) {
      // ignore localStorage parsing errors
    }
    return null;
  });

  useEffect(() => {
    if (token && !user) {
      try {
        const savedLogin = localStorage.getItem("userLogin");
        if (savedLogin) setUser({ login: savedLogin });
      } catch (e) {
        // ignore localStorage errors
      }
    }
    // Mettre à jour le rôle si on a un token
    try {
      const t = token || localStorage.getItem("village_token");
      if (t && typeof t === "string" && t.includes(".")) {
        const payload = t.split(".")[1];
        const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
        if (decoded && decoded.role) setRole(decoded.role);
      }
    } catch (e) {
      // ignore
    }
  }, [token, user]);

  const login = (newToken, userInfo) => {
    try {
      if (newToken) localStorage.setItem("token", newToken);
      if (userInfo?.login) localStorage.setItem("userLogin", userInfo.login);
    } catch (e) {
      // ignore
    }
    setToken(newToken);
    setUser(userInfo || null);
    // update role from userInfo if provided
    try {
      if (userInfo && typeof userInfo.role === "string") {
        setRole(userInfo.role);
        localStorage.setItem("village_user", JSON.stringify(userInfo));
      } else if (newToken && typeof newToken === "string" && newToken.includes(".")) {
        const payload = newToken.split(".")[1];
        const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
        if (decoded && decoded.role) {
          setRole(decoded.role);
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("userLogin");
    } catch (e) {
      // ignore
    }
    setToken(null);
    setUser(null);
    setUsers([]);
    setRole(null);
  };

  const value = { user, users, token, role, login, logout, setUsers };

  // Utilise React.createElement pour éviter JSX dans un fichier .js
  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  return useContext(AuthContext);
}

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

  useEffect(() => {
    if (token && !user) {
      try {
        const savedLogin = localStorage.getItem("userLogin");
        if (savedLogin) setUser({ login: savedLogin });
      } catch (e) {
        // ignore localStorage errors
      }
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
  };

  const value = { user, users, token, login, logout, setUsers };

  // Utilise React.createElement pour éviter JSX dans un fichier .js
  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  return useContext(AuthContext);
}

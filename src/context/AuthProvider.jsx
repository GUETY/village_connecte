import React, { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import { jwtDecode } from "jwt-decode";
import { loginRequest } from "../api/auth.api";

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      const decoded = jwtDecode(token);

      // Vérifier expiration
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        return null;
      }

      return { id: decoded.id, login: decoded.login, role: decoded.role };
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const res = await loginRequest(credentials);

      if (res?.data?.token) {
        const decoded = jwtDecode(res.data.token);

        // Stocker token
        localStorage.setItem("token", res.data.token);

        // Stocker user
        setUser({
          id: decoded.id,
          login: decoded.login,
          role: decoded.role,
        });

        return { ok: true, user: decoded };
      }

      return { ok: false, message: res?.data?.message || "Erreur" };

    } catch (err) {
      return { ok: false, message: err.response?.data?.message || err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  //  Vérification automatique chaque minute
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const decoded = jwtDecode(token);

        if (decoded.exp * 1000 < Date.now()) {
          logout();
        }
      } catch {
        logout();
      }
    }, 60000); // toutes les 60 secondes

    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

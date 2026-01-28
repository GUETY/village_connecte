import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * ProtectedRoute — protège une route (authentification uniquement)
 * @param {ReactNode} children
 */
export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  // Si pas connecté, rediriger vers la page de login
  if (!user) return <Navigate to="/" replace />;
  // Autoriser l'accès indépendamment du rôle (suppression des restrictions par rôle)
  return children;
}

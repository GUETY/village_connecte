// src/pages/NotFound.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
      <p className="text-xl mb-6">Page non trouvée</p>
      <Link to="/" className="text-blue-500 hover:underline">
        Retour à l'accueil
      </Link>
    </div>
  );
}

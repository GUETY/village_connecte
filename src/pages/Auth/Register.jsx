// src/pages/Auth/Register.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerRequest } from "../../services/auth.api";

// Chargement sûr du logo depuis /public (accessible à la racine)
let logoVillage;
try {
  logoVillage = new URL("/logo-village.jpeg", import.meta.url).href;
} catch (e) {
  logoVillage = null;
}

export default function Register() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      const res = await registerRequest({ login, password });
      if (res.ok) {
        setSuccess("Utilisateur créé avec succès ! Redirection vers login...");
        setTimeout(() => navigate("/"), 2000); // redirige vers login
      } else {
        setError(res.message || "Erreur lors de l'inscription");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      {/* Logo */}
      <div className="flex flex-col items-center mb-6">
        <img
          src={logoVillage || "/logo-village.jpeg"}
          alt="Logo Village Connecté"
          className="w-44 h-44 rounded-full object-cover shadow-md"
        />
      </div>

      {/* Bloc Register */}
      <div
        className="bg-white rounded-2xl shadow-lg w-[440px]"
        style={{ border: "5px solid #5B1FB4" }}
      >
        <div
          className="text-white text-center py-4 rounded-t-xl text-xl font-semibold"
          style={{ backgroundColor: "#5B1FB4" }}
        >
          Réinitialiser votre mot de passe
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-8">
          {/* Messages */}
          {error && (
            <p className="text-red-500 text-sm mb-3 text-right">{error}</p>
          )}
          {success && (
            <p className="text-green-500 text-sm mb-3 text-right">{success}</p>
          )}

          {/* Login */}
          <div className="flex items-center justify-between mb-6">
            <label className="text-gray-800 font-semibold w-1/3 text-lg">
              Login
            </label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-2/3 border-[3px] border-orange-400 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300 text-lg"
              required
            />
          </div>

          {/* Password */}
          <div className="flex items-center justify-between mb-6">
            <label className="text-gray-800 font-semibold w-1/3 text-lg">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-2/3 border-[3px] border-orange-400 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300 text-lg"
              required
            />
          </div>

          {/* Confirm Password */}
          <div className="flex items-center justify-between mb-8">
            <label className="text-gray-800 font-semibold w-1/3 text-lg">
              Confirmer
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-2/3 border-[3px] border-orange-400 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300 text-lg"
              required
            />
          </div>

          {/* Bouton */}
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="text-base text-gray-500 hover:underline"
            >
              Retour à la connexion
            </Link>
            <button
              type="submit"
              className="bg-orange-400 hover:bg-orange-500 text-white font-semibold py-2.5 px-6 rounded-md transition duration-300 text-lg"
            >
              S'enregistré
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// src/pages/Auth/ResetPassword.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { resetPasswordRequest } from "../../services/auth.api"; 
// Chargement sûr du logo depuis /public (accessible à la racine)
let logoVillage;
try {
  logoVillage = new URL("/logo-village.jpeg", import.meta.url).href;
} catch (e) {
  logoVillage = null;
}

export default function ResetPassword() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  // 👉 Récupération du token dans l’URL : /reset-password?token=xxxx
  const token = new URLSearchParams(location.search).get("token");

  const handleSubmit = async (e) => {
  e.preventDefault();
  setMessage("");

  if (!token) {
    setMessage("⚠️ Token manquant. Veuillez utiliser le lien envoyé par e-mail.");
    return;
  }

  if (password !== confirmPassword) {
    setMessage("⚠️ Les mots de passe ne correspondent pas");
    return;
  }

  try {
    // 👉 ENFIN le bon format pour le backend !
    const res = await resetPasswordRequest({
      token: token,
      newPassword: password
    });

    if (res.ok || res.success) {
      setMessage("✅ Mot de passe réinitialisé avec succès !");
      setTimeout(() => navigate("/"), 2000);
    } else {
      setMessage(res.message || "Erreur lors de la réinitialisation");
    }
  } catch (err) {
    setMessage(err.response?.data?.message || err.message);
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

      {/* Bloc principal */}
      <div
        className="bg-white rounded-2xl shadow-lg w-[480px]"
        style={{ border: "5px solid #5B1FB4" }}
      >
        {/* Bandeau violet */}
        <div
          className="text-white text-center py-4 text-2xl font-bold rounded-t-xl"
          style={{ backgroundColor: "#5B1FB4" }}
        >
          Réinitialiser votre mot de passe
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="px-10 py-8">
          {message && (
            <p className="text-center text-lg mb-6 text-red-500 font-semibold">
              {message}
            </p>
          )}

          {/* Login */}
          <div className="flex items-center justify-between mb-7">
            <label className="text-gray-800 font-bold w-[45%] text-xl">
              Login
            </label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-[55%] border-[3px] border-orange-400 rounded-md px-4 py-2.5 text-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
              required
            />
          </div>

          {/* Mot de passe */}
          <div className="flex items-center justify-between mb-7">
            <label className="text-gray-800 font-bold w-[45%] text-xl">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-[55%] border-[3px] border-orange-400 rounded-md px-4 py-2.5 text-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
              required
            />
          </div>

          {/* Confirmation */}
          <div className="flex items-center justify-between mb-8">
            <label className="text-gray-800 font-bold w-[45%] text-xl leading-tight">
              Confirmer <br /> Mot de passe
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-[55%] border-[3px] border-orange-400 rounded-md px-4 py-2.5 text-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
              required
            />
          </div>

          {/* Bouton + lien bas */}
          <div className="flex justify-end items-center space-x-5 mt-8">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-lg text-blue-700 font-medium hover:underline"
            >
              Retour à l'accueil
            </button>
            <button
              type="submit"
              className="bg-orange-400 hover:bg-orange-500 text-white font-bold py-2.5 px-7 rounded-md text-lg transition duration-300"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api, { authAPI, setAuthToken } from "../../services/api.js";
import Village from "../../../public/logo-village.jpeg";

// Chargement sûr du logo (évite ReferenceError si le fichier est absent)
// On utilise new URL pour que Vite gère correctement l'import au runtime.
// Si l'image n'existe pas, Village restera null et on affichera un fallback.
let logoVillage;
try {
  // accès au fichier dans public via la racine
  logoVillage = new URL("/logo-village.jpeg", import.meta.url).href;
} catch (e) {
  logoVillage = null;
}

export default function Login() {
  // États locaux pour les champs du formulaire et les erreurs
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // handleSubmit : gère la soumission du formulaire de connexion
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // réinitialise le message d'erreur avant tentative

    try { 
      let res;
      try {
        // Essaye le endpoint /auth/login
        res = await authAPI.login({ login, password });
      } catch (err) {
        // Si /auth/login n'existe pas (404), tente un fallback vers /login
        if (err && err.status === 404) {
          res = await authAPI.loginFallback({ login, password });
        } else {
          // réemet l'erreur pour le catch principal
          throw err;
        }
      }

      // Récupère le token selon différents formats possibles renvoyés par l'API
      const token =
        res?.token ||
        res?.access_token ||
        (res.data && (res.data.token || res.data.access_token));
      if (!token) {
        // si aucun token, affiche une erreur utile
        setError("Impossible de récupérer le token depuis la réponse du serveur.");
        return;
      }

      // Applique le token aux en-têtes axios et le stocke en localStorage
      setAuthToken(token);
      localStorage.setItem("village_token", token);

      // Stocke éventuellement les infos utilisateur si présentes
      if (res.user || res.data?.user) {
        localStorage.setItem(
          "village_user",
          JSON.stringify(res.user || res.data.user)
        );
      }

      // Redirection après connexion réussie (adapter la route si besoin)
      navigate("/consultation-des-alertes");
    } catch (err) {
      // Gestion et affichage d'erreur : privilégier le message serveur si présent
      console.error("Login error", err);
      const msg = err?.data?.message || err?.data || "Erreur de connexion";
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      {/* Logo ou fallback */}
      <div className="flex flex-col items-center mb-4">
        <div className="rounded-full overflow-hidden shadow-md">
          {logoVillage ? (
            <img
              src={logoVillage}
              alt="Logo Village Connecté"
              className="w-36 h-36 rounded-full object-cover"
            />
          ) : (
            <div className="w-36 h-36 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
              Logo
            </div>
          )}
        </div>
      </div>

      {/* Conteneur du formulaire */}
      <div
        className="bg-white rounded-2xl shadow-lg w-[440px]"
        style={{ border: "5px solid #5B1FB4" }}
      >
        <div
          className="text-white text-center py-4 rounded-t-xl text-xl font-semibold"
          style={{ backgroundColor: "#5B1FB4" }}
        >
          Connexion
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-8">
          {/* Affiche l'erreur si présente */}
          {error && (
            <p className="text-red-500 text-sm mb-3 text-right">{error}</p>
          )}

          {/* Champ login */}
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

          {/* Champ mot de passe */}
          <div className="flex items-center justify-between mb-8">
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

          {/* Liens d'aide et bouton de soumission */}
          <div className="flex items-center justify-between">
            <Link
              to="/register"
              className="text-base text-gray-500 hover:underline"
            >
              Mot de passe oublié ?
            </Link>
            <button
              type="submit"
              className="bg-orange-400 hover:bg-orange-500 text-white font-semibold py-2.5 px-6 rounded-md transition duration-300 text-lg"
            >
              Se connecter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
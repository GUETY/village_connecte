import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api, { authAPI, setAuthToken } from "../../services/api.js";
import Village from "../../../public/logo-village.jpeg";
import DOMPurify from "dompurify"; // npm install dompurify

// Chargement sûr du logo
let logoVillage;
try {
  logoVillage = new URL("/logo-village.jpeg", import.meta.url).href;
} catch (e) {
  logoVillage = null;
}

// CSS animations
const errorAnimations = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .error-shake {
    animation: shake 0.5s ease-in-out;
  }

  .error-message {
    animation: slideDown 0.3s ease-out;
  }
`;

export default function Login() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0); // Compteur de tentatives
  const [lockedUntil, setLockedUntil] = useState(null); // Blocage temporaire
  const navigate = useNavigate();
  const submitTimeoutRef = useRef(null);

  // Validation des entrées côté client
  const validateInputs = (loginVal, passwordVal) => {
    // Vérifier la longueur
    if (!loginVal || !passwordVal) {
      setError("Veuillez remplir tous les champs");
      setShowError(true);
      return false;
    }

    // Longueur max pour éviter les DoS
    if (loginVal.length > 255 || passwordVal.length > 255) {
      setError("Les champs ne doivent pas dépasser 255 caractères");
      setShowError(true);
      return false;
    }

    // Vérifier les caractères valides (éviter injections)
    const loginRegex = /^[a-zA-Z0-9._@-]+$/;
    if (!loginRegex.test(loginVal)) {
      setError("Le login contient des caractères non valides");
      setShowError(true);
      return false;
    }

    return true;
  };

  // Rate limiting : bloquer après 5 tentatives
  const checkRateLimit = () => {
    if (lockedUntil && new Date() < new Date(lockedUntil)) {
      const remainingSeconds = Math.ceil((new Date(lockedUntil) - new Date()) / 1000);
      setError(`Trop de tentatives. Réessayez dans ${remainingSeconds}s`);
      setShowError(true);
      return false;
    }

    if (attempts >= 5) {
      const lockTime = new Date(new Date().getTime() + 15 * 60 * 1000); // 15 minutes
      setLockedUntil(lockTime.toISOString());
      setError("Compte temporairement bloqué (15 minutes) pour sécurité");
      setShowError(true);
      return false;
    }

    return true;
  };

  // Nettoyer les données sensibles
  const cleanup = () => {
    setPassword(""); // Ne pas stocker le mot de passe
  };

  // handleSubmit sécurisé
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Vérifier le rate limiting
    if (!checkRateLimit()) {
      return;
    }

    // Valider les inputs
    if (!validateInputs(login, password)) {
      return;
    }

    setError("");
    setShowError(false);
    setIsLoading(true);

    // Timeout pour éviter les requêtes longues
    submitTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      setError("La requête a pris trop de temps. Veuillez réessayer.");
      setShowError(true);
      setAttempts(attempts + 1);
    }, 10000); // 10 secondes

    try {
      let res;
      try {
        // Sanitizer les données avant envoi
        const sanitizedLogin = DOMPurify.sanitize(login.trim());
        
        res = await authAPI.login({ 
          login: sanitizedLogin, 
          password: password // Le mot de passe ne doit jamais être loggé
        });
      } catch (err) {
        clearTimeout(submitTimeoutRef.current);
        setIsLoading(false);

        // Gestion des erreurs HTTP
        if (err?.response?.status === 404) {
          try {
            const sanitizedLogin = DOMPurify.sanitize(login.trim());
            res = await authAPI.loginFallback({ 
              login: sanitizedLogin, 
              password: password 
            });
          } catch (fallbackErr) {
            const fallbackMsg = 
              fallbackErr?.response?.data?.message || 
              "Impossible de se connecter. Veuillez vérifier vos identifiants.";
            setError(DOMPurify.sanitize(fallbackMsg)); // Sanitizer la réponse
            setShowError(true);
            setAttempts(attempts + 1);
            return;
          }
        } else if (err?.response?.status === 401) {
          setError("Login ou mot de passe incorrect");
          setShowError(true);
          setAttempts(attempts + 1);
          return;
        } else if (err?.response?.status === 400) {
          const msg = err?.response?.data?.message || "Veuillez remplir tous les champs correctement";
          setError(DOMPurify.sanitize(msg));
          setShowError(true);
          setAttempts(attempts + 1);
          return;
        } else if (err?.response?.status === 429) {
          // Too Many Requests
          setError("Trop de tentatives. Veuillez réessayer dans quelques minutes.");
          setShowError(true);
          setAttempts(5); // Bloquer immédiatement
          return;
        } else if (err?.response?.status >= 500) {
          setError("Erreur serveur. Veuillez réessayer plus tard.");
          setShowError(true);
          return;
        } else if (err?.message === "Network Error" || !err?.response) {
          setError("Erreur de connexion. Vérifiez votre connexion internet.");
          setShowError(true);
          return;
        } else {
          throw err;
        }
      }

      clearTimeout(submitTimeoutRef.current);

      // Valider la réponse
      const token =
        res?.token ||
        res?.access_token ||
        (res.data && (res.data.token || res.data.access_token));

      if (!token || typeof token !== "string" || token.length > 5000) {
        setError("Réponse serveur invalide. Veuillez réessayer.");
        setShowError(true);
        setIsLoading(false);
        return;
      }

      // Vérifier que le token est un JWT valide (basique)
      if (!token.includes(".")) {
        setError("Token invalide reçu du serveur.");
        setShowError(true);
        setIsLoading(false);
        return;
      }

      // Stocker le token en toute sécurité
      setAuthToken(token);
      localStorage.setItem("village_token", token);

      // Stocker les infos utilisateur si présentes (et les sanitizer)
      if (res.user || res.data?.user) {
        const user = res.user || res.data.user;
        // Valider que user est un objet
        if (typeof user === "object" && user !== null) {
          localStorage.setItem("village_user", JSON.stringify(user));
        }
      }

      // Réinitialiser les tentatives en cas de succès
      setAttempts(0);
      setLockedUntil(null);
      cleanup();
      
      // Redirection
      navigate("/Dashboard");
    } catch (err) {
      clearTimeout(submitTimeoutRef.current);
      setIsLoading(false);
      console.error("Login error (non-détaillé pour sécurité)");
      
      const msg = 
        err?.response?.data?.message || 
        "Vos informations ne correspondent pas";
      setError(DOMPurify.sanitize(msg));
      setShowError(true);
      setAttempts(attempts + 1);
    }
  };

  // Nettoyer les timeouts au démontage
  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
    };
  }, []);

  // Bloquer le formulaire si compte verrouillé
  const isFormDisabled = lockedUntil && new Date() < new Date(lockedUntil);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <style>{errorAnimations}</style>

      {/* Logo */}
      <div className="flex flex-col items-center mb-4">
        <div className="rounded-full overflow-hidden shadow-md">
          {logoVillage ? (
            <img
              src={logoVillage}
              alt="Logo Village Connecté"
              className="w-36 h-36 rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-36 h-36 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
              Logo
            </div>
          )}
        </div>
      </div>

      {/* Formulaire */}
      <div
        className={`bg-white rounded-2xl shadow-lg w-[440px] transition-all duration-300 ${
          showError ? "error-shake" : ""
        } ${isFormDisabled ? "opacity-50 pointer-events-none" : ""}`}
        style={{ border: "5px solid #5B1FB4" }}
      >
        <div
          className="text-white text-center py-4 rounded-t-xl text-xl font-semibold"
          style={{ backgroundColor: "#5B1FB4" }}
        >
          Connexion
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-8" noValidate>
          {/* Message d'erreur */}
          {error && (
            <div
              className="error-message bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 mb-4 rounded"
              role="alert"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="font-semibold text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Compteur de tentatives */}
          {attempts > 0 && attempts < 5 && (
            <div className="text-yellow-600 text-xs mb-3 text-center">
              Tentatives restantes : {5 - attempts}
            </div>
          )}

          {/* Login */}
          <div className="flex items-center justify-between mb-6">
            <label className="text-gray-800 font-semibold w-1/3 text-lg">
              Login
            </label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value.slice(0, 255))} // Limiter à 255 caractères
              className="w-2/3 border-[3px] border-orange-400 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300 text-lg"
              disabled={isLoading || isFormDisabled}
              autoComplete="username"
              required
              maxLength="255"
            />
          </div>

          {/* Mot de passe */}
          <div className="flex items-center justify-between mb-8">
            <label className="text-gray-800 font-semibold w-1/3 text-lg">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value.slice(0, 255))} // Limiter à 255 caractères
              className="w-2/3 border-[3px] border-orange-400 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300 text-lg"
              disabled={isLoading || isFormDisabled}
              autoComplete="current-password"
              required
              maxLength="255"
            />
          </div>

          {/* Boutons */}
          <div className="flex items-center justify-between">
            <Link
              to="/register"
              className="text-base text-gray-500 hover:underline"
            >
              Mot de passe oublié ?
            </Link>
            <button
              type="submit"
              disabled={isLoading || isFormDisabled}
              className="bg-orange-400 hover:bg-orange-500 text-white font-semibold py-2.5 px-6 rounded-md transition duration-300 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Connexion..." : "Se connecter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
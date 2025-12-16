import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Header({ sidebarOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname || "/";
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // mapping statique + détection robuste par sous-chaîne
  const routeTitleMap = {
    "/dashboard/alertes": "Gestion des alertes",
    "/alertes": "Gestion des alertes",
  };

  // priorité : correspondance exacte, sinon détection par mots-clés
  let displayTitle = routeTitleMap[path] || "Tableau de bord de l'administrateur";

  // Cas spécial : page Gestion des accès utilisateurs (détection insensible à la casse)
  const lcPath = String(path || "").toLowerCase();
  if (lcPath.includes("users") || lcPath.includes("acces") || lcPath.includes("gestion-des-acces") || lcPath.includes("gestion-des-acces-utilisateurs") || lcPath.includes("acces-utilisateurs") || lcPath.includes("utilisateurs")) {
    displayTitle = "Gestion des accès utilisateurs";
  }

  // Cas spécial : création de groupe et de login
  if (lcPath.includes("groupe-login") || lcPath.includes("creation-groupe-login")) {
    displayTitle = "Création de groupe et de login";
  }

  // Cas spécial : page Alertes
  if (lcPath.includes("alerte") || lcPath.includes("alertes")) {
    displayTitle = "Gestion des alertes";
  }

  // autres détections utiles (exemples)
  // legacy catch-all: if path includes 'users' (case-insensitive) set title
  if (lcPath.includes("users") && !lcPath.includes("bornes")) {
    displayTitle = "Gestion des accès utilisateurs";
  }

  const handleLogout = async () => {
    try {
      // Supprimer le token du localStorage
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      
      // Rediriger vers la page de connexion
      navigate("/login");
      setShowLogoutMenu(false);
    } catch (err) {
      console.error("Erreur lors de la déconnexion:", err);
    }
  };
  
  return (
    <header
      role="banner"
      aria-label="Barre supérieure du tableau de bord Villages Connectés"
      className={`fixed top-0 z-40 text-white h-[4.6rem] flex items-center justify-between px-8 transition-all duration-300`}
      style={{
        left: sidebarOpen ? "18rem" : "6rem",
        right: 0,
        background: "linear-gradient(90deg, #5B1FB4 0%, #5B1FB4 100%)",
        boxShadow: "0 4px 10px rgba(0,0,0,0.18)",
      }}
    >
      {/* Titre centré */}
      <div
        className="absolute left-1/2 transform -translate-x-1/2 text-center whitespace-nowrap max-w-[80%] truncate"
        style={{ 
          color: "rgba(255,255,255,0.95)",
          fontSize: "1.5rem",
          fontWeight: 700
        }}
      >
        {displayTitle}
      </div>

      {/* Date et heure */}
      <div
        className="ml-auto text-[1.1rem] font-semibold flex items-center gap-5"
        style={{ color: "rgba(255,255,255,0.95)" }}
      >
        <span>{now.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
        <span>{now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", hour12: false })}</span>
        
        {/* Bouton déconnexion avec menu */}
        <div className="relative">
          <button
            onClick={() => setShowLogoutMenu(!showLogoutMenu)}
            className="text-white/80 hover:text-white text-[1.3rem] transition-colors cursor-pointer p-1 rounded hover:bg-white/10"
            title="Déconnexion"
            aria-label="Menu déconnexion"
            aria-expanded={showLogoutMenu}
          >
            &gt;
          </button>

          {/* Menu déconnexion */}
          {showLogoutMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 animate-fadeIn">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-gray-800 hover:bg-red-50 hover:text-red-600 font-semibold transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9l-1.293 1.293z" clipRule="evenodd" />
                </svg>
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

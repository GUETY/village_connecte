import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

/* Header séparé — titre calculé depuis la route */
export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname || "/";
  const [showLogoutMenu, setShowLogoutMenu] = React.useState(false);

  const routeTitleMap = {
    "/": "Consultation des alertes",
    "/consultation-des-alertes": "Consultation des alertes",
    "/gestion-des-bornes-wifi": "Gestion des Bornes Wi‑Fi",
    "/gestion_des_bornes_wifi": "Gestion des Bornes Wi‑Fi",
    "/gestion-des-bornes-acces-utilisateurs": "Gestion des accès utilisateurs",
    "/gestion-des-bornes-alertes": "Gestion des alertes",
    "/gestion-des-bornes-consultations": "Consultation des alertes",
    "/gestion-des-transactions": "Gestion des transactions",
    "/statistiques": "Statistiques",
    "/gestions-des-agents": "Gestion des agents",
    "/creation-de-forfaits": "Création de forfaits",
    "/generer-code-de-connexions": "Générer des codes de connexion",
  };

  // priorité : mapping exact, sinon détection par mot-clé "alerte"
  let displayTitle = routeTitleMap[path] || "Gestion des transactions";
  if (path.toLowerCase().includes("alerte")) {
    displayTitle = "Consultation des alertes";
  }

  const handleLogout = () => {
    try {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      navigate("/login");
      setShowLogoutMenu(false);
    } catch (err) {
      console.error("Erreur lors de la déconnexion:", err);
    }
  };

  return (
    <header
      className="header-bg text-white py-5 px-6 flex items-center justify-between"
      style={{ boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.05)" }}
    >
      {/* Placeholder left pour alignement (le toggle reste dans la sidebar si besoin) */}
      <div className="w-16" />

      <h2 className="text-center text-3xl font-bold flex-1">{displayTitle}</h2>

      {/* Flèche + menu déconnexion */}
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

        {showLogoutMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-gray-800 hover:bg-red-50 hover:text-red-600 font-semibold transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9l-1.293 1.293z"
                  clipRule="evenodd"
                />
              </svg>
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
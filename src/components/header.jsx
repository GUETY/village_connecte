import React from "react";
import { useLocation } from "react-router-dom";

/* Header séparé — titre calculé depuis la route */
export default function Header() {
  const location = useLocation();
  const path = location.pathname || "/";

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

  return (
    <header
      className="header-bg text-white py-5 px-6 flex items-center justify-between"
      style={{ boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.05)" }}
    >
      {/* Placeholder left pour alignement (le toggle reste dans la sidebar si besoin) */}
      <div className="w-16" />

      <h2 className="text-center text-3xl font-bold flex-1">{displayTitle}</h2>

    </header>
  );
}
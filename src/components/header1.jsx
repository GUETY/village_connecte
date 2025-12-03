import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function Header({ sidebarOpen }) {
  const location = useLocation();
  const path = location.pathname || "/";

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // mapping statique + détection robuste par sous-chaîne
  const routeTitleMap = {
    "/dashboard/alertes": "Gestion des Alertes",
    "/alertes": "Gestion des Alertes",
  };

  // priorité : correspondance exacte, sinon détection par mots-clés
  let displayTitle = routeTitleMap[path] || "Villages connectés — Tableau de bord de l’administrateur";

  // Cas spécial : page Gestion des accès utilisateurs
  if (
    path.includes("acces") ||
    path.includes("acces-utilisateurs") ||
    path.includes("gestion-des-acces")
  ) {
    displayTitle = "Gestion des accès utilisateurs";
  }

  // Cas spécial : création de groupe et login
  if (path.includes("groupe-login") || path.includes("Creation-groupe-login")) {
    displayTitle = "Création de Groupe et de Login";
  }

  // Cas spécial : page Alertes
  if (path.toLowerCase().includes("alerte") || path.toLowerCase().includes("alertes")) {
    displayTitle = "Gestion des Alertes";
  }

  // autres détections utiles (exemples)
  if (path.includes("Users") && !path.includes("bornes")) {
    displayTitle = "Gestion des Accès Utilisateurs";
  }
  
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
        className="absolute left-1/2 transform -translate-x-1/2 text-center text-[1.2rem] sm:text-[1.3rem] font-semibold whitespace-nowrap max-w-[80%] truncate"
        style={{ color: "rgba(255,255,255,0.95)" }}
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
        <span className="text-white/80 text-[1.3rem]">&gt;</span>
      </div>
    </header>
  );
}

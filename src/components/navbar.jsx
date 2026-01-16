import React, { useState, useEffect } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import Header from "./header";

/**
 * Navbar réutilisable — header retiré d'ici (header.jsx gère le titre dynamique)
 * - icônes agrandies quand sidebar fermée
 * - animations hover / glow
 */
export default function Navbar({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [bornesOpen, setBornesOpen] = useState(true);
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.includes("bornes") || location.pathname.includes("bornes_wifi")) {
      setBornesOpen(true);
    }
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-[var(--vc-bg)]">
      {/* Sidebar */}
      <aside
        id="sidebar"
        data-bornes-open={bornesOpen}
        className={`sidebar-bg text-white fixed left-0 top-0 h-screen flex flex-col transition-all duration-300 ${sidebarOpen ? "w-72" : "w-24"} overflow-y-auto z-50`}
        aria-label="Barre latérale"
      >
        {/* TOP: logo + hamburger + Menu */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--vc-purple-dark)]">
          {/* Logo Village Connect - Rond */}
          <div className="vc-logo flex-shrink-0" aria-hidden>
            <div className={`${sidebarOpen ? "w-10 h-10" : "w-12 h-12"} rounded-full overflow-hidden flex items-center justify-center bg-white shadow-md transition-all duration-300`}>
              <img 
                src="/logo-village.jpeg" 
                alt="Village Connect" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Button hamburger — clique sur l'icône pour toggle */}
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            className="flex items-center gap-2 text-white hover:text-white/90 focus:outline-none transition-all"
            aria-label="Toggle sidebar"
            title="Ouvrir / fermer la barre latérale"
          >
            <svg
              className="w-5 h-5 icon-strong hover:scale-125 transition-transform"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              aria-hidden
              style={{ cursor: "pointer" }}
            >
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            {/* Texte "Menu" visible seulement si sidebar ouverte */}
            <span className={`text-lg font-semibold whitespace-nowrap transition-all duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0 hidden"}`}>
              Menu
            </span>
          </button>
        </div>

        <nav className="flex-1 overflow-auto px-2 py-4">
          <SidebarLink
            to="/dashboard"
            label="Accueil"
            icon={HomeIcon}
            location={location}
            sidebarOpen={sidebarOpen}
          />

          <SidebarLink
            to="/groupe-login"
            label="Gestion des utilisateurs"
            icon={UserIcon}
            location={location}
            sidebarOpen={sidebarOpen}
          />

          {/* Gestion des bornes (groupe) */}
          <div className="mt-3">
            <button
              onClick={() => setBornesOpen((s) => !s)}
              aria-expanded={bornesOpen}
              className="w-full px-3 py-2 flex items-center justify-between gap-3 text-sm font-semibold rounded transition-colors hover:bg-white/6"
              title={sidebarOpen ? "" : "Gestion des bornes"}
            >
              <div className="flex items-center gap-3">
                <AntennaIcon className={`icon-strong transition-all ${sidebarOpen ? "w-5 h-5" : "w-6 h-6 hover:scale-125"}`} />
                {/* Label visible seulement si sidebar ouverte */}
                <span className={`whitespace-nowrap transition-all duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0 hidden"}`}>
                  Gestion des bornes
                </span>
              </div>

              {/* Chevron visible seulement si sidebar ouverte */}
              <svg
                className={`w-4 h-4 transform transition-all ${bornesOpen ? "rotate-90" : "rotate-0"} ${sidebarOpen ? "opacity-100" : "opacity-0 hidden"}`}
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                aria-hidden
              >
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 6l6 4-6 4" />
              </svg>
            </button>

            {/* Sous-éléments visibles seulement si sidebar ouverte ET bornesOpen */}
            <div
              id="bornes-subnav"
              className={`ml-8 flex flex-col text-sm space-y-1 mt-2 transition-all duration-300 overflow-hidden ${
                bornesOpen && sidebarOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <SidebarSubLink
                to="/users"
                label="Gestion des accès utilisateurs"
                location={location}
              />
              <SidebarSubLink
                to="/alertes"
                label="Gestions des alertes"
                location={location}
              />
              <SidebarSubLink
                to="/consultation-des-alertes"                  // route existante prise en charge par le header
                alt="/consultation_des_alertes" // ancien alias conservé pour compatibilité
                label="Consultations des alertes"
                location={location}
              />
              <SidebarSubLink
                to="/gestion-des-bornes-wifi"
                alt="/gestion_des_bornes_wifi"
                label="Gestion des bornes wi‑fi"
                location={location}
              />
            </div>
          </div>

          <div className="mt-5">
            <SidebarLink
              to="/gestions-des-transactions"
              label="Gestions des transactions"
              icon={ChartIcon}
              location={location}
              sidebarOpen={sidebarOpen}
            />
            <SidebarLink
              to="/statistiques"
              label="Statistiques"
              icon={StatsIcon}
              location={location}
              sidebarOpen={sidebarOpen}
            />
            <SidebarLink
              to="/gestions-des-agents"
              label="Gestions des agents"
              icon={AgentsIcon}
              location={location}
              sidebarOpen={sidebarOpen}
            />
            <SidebarLink
              to="/creation-de-forfaits"
              label="Création de forfaits"
              icon={BookIcon}
              location={location}
              sidebarOpen={sidebarOpen}
            />
            <SidebarLink
              to="/generer-code-de-connexions"
              label="Générer code de connexions"
              icon={CodeIcon}
              location={location}
              sidebarOpen={sidebarOpen}
            />
          </div>
        </nav>
      </aside>

      {/* Ajouter margin-left au conteneur principal pour ne pas superposer le contenu */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? "ml-72" : "ml-24"}`}>
        <Header sidebarOpen={sidebarOpen} />
        <main className="p-8 pt-6">{children}</main>
      </div>

      {/* Barre supérieure fixe (z-index 50) */}
      <div className="fixed top-0 left-0 w-full z-50 bg-[#ff7a00]">
        {/* ...contenu de la barre... */}
      </div>
    </div>
  );
}

/* SidebarLink : masquer le texte si sidebar fermée + animations icône */
function SidebarLink({ to, label, icon: Icon, location, sidebarOpen }) {
  const pathname = location?.pathname || "";
  const isActive = (to === "/" && pathname === "/") || (to !== "/" && pathname.startsWith(to));
  const base = "w-full text-left px-3 py-2 rounded flex items-center gap-3 transition-all duration-200 hover:bg-white/10 hover:shadow-md group";
  const color = isActive ? "text-red-500 font-semibold" : "text-white hover:text-white/95";

  return (
    <Link to={to} className={`${base} ${color}`} title={!sidebarOpen ? label : ""}>
      {/* Icône agrandie quand sidebar fermée + animation glow hover */}
      {Icon && (
        <div className={`relative transition-all duration-200 ${sidebarOpen ? "" : "group-hover:drop-shadow-lg"}`}>
          <Icon
            className={`${
              isActive ? "text-red-500" : "text-white"
            } icon-strong transition-all flex-shrink-0 ${sidebarOpen ? "w-5 h-5 group-hover:scale-110" : "w-7 h-7 group-hover:scale-125"} ${
              !sidebarOpen ? "group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" : ""
            }`}
          />
        </div>
      )}
      {/* Label disparaît si sidebar fermée */}
      <span className={`text-sm whitespace-nowrap transition-all duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0 hidden"}`}>
        {label}
      </span>
    </Link>
  );
}

function SidebarSubLink({ to, alt, label, location }) {
  const pathname = location?.pathname || "";
  const isActive = pathname === to || (alt && pathname === alt);
  const base = "w-full text-left px-2 py-1 rounded whitespace-nowrap transition-all duration-200 hover:bg-white/10";
  const color = isActive ? "text-red-500 font-semibold" : "text-white/90 hover:text-white";

  return (
    <Link to={to} className={`${base} ${color}`}>
      <span className="text-sm">{label}</span>
    </Link>
  );
}

/* ---------- Icônes SVG renforcées (strokeWidth=2) ---------- */
function HomeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}

function UserIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16 14a4 4 0 10-8 0v2h8v-2zM12 6a3 3 0 110 6 3 3 0 010-6z" />
    </svg>
  );
}

function AntennaIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 20v-8M8 12a4 4 0 018 0M5 9a7 7 0 0114 0" />
    </svg>
  );
}

function ChartIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M9 14l3-4 2 3 3-6" />
    </svg>
  );
}

function StatsIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 13v6M12 8v11M17 4v15" />
    </svg>
  );
}

function AgentsIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16 11a4 4 0 10-8 0M12 15v6M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2" />
    </svg>
  );
}

function BookIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 7a4 4 0 014-4h10v14a2 2 0 01-2 2H7a4 4 0 01-4-4V7z" />
    </svg>
  );
}

function CodeIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16 18l6-6-6-6M8 6L2 12l6 6" />
    </svg>
  );
}
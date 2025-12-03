import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import Header from "./header1";
// Chargement sûr du logo depuis /public (accessible à la racine)
let LogoImg;
try {
  // adapte le nom si votre fichier public s'appelle différemment (ex: /Logo.jpg)
  LogoImg = new URL("/logo-village.jpeg", import.meta.url).href;
} catch (e) {
  // fallback simple si new URL échoue
  LogoImg = "/logo-village.jpeg";
}
import PageLogo from "./PageLogo/PageLogo";

export default function Navbar({ children, onSidebarToggle }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [bornesOpen, setBornesOpen] = useState(true);
  const location = useLocation();

  // Désactive le scroll horizontal globalement (et restaure à la destruction)
  useEffect(() => {
    const prevHtml = document.documentElement.style.overflowX;
    const prevBody = document.body.style.overflowX;
    document.documentElement.style.overflowX = "hidden";
    document.body.style.overflowX = "hidden";
    return () => {
      document.documentElement.style.overflowX = prevHtml || "";
      document.body.style.overflowX = prevBody || "";
    };
  }, []);

  // hauteur du header (modifiable) — on utilisera cette variable pour le padding du main
  const HEADER_HEIGHT = "64px"; // ou "72px" si header plus grand

  // Notifie le parent quand la sidebar change
  useEffect(() => {
    if (onSidebarToggle) onSidebarToggle(sidebarOpen);
  }, [sidebarOpen, onSidebarToggle]);

  // Ouvre automatiquement le sous-menu Bornes si la route contient "bornes"
  useEffect(() => {
    if (
      location.pathname.includes("bornes") || 
      location.pathname.includes("bornes_wifi") ||
      location.pathname.includes("alertes")
    ) {
      setBornesOpen(true);
    }
  }, [location.pathname]);

  return (
    // expose la variable CSS --vc-header-height et applique layout
    <div style={{ ["--vc-header-height"]: HEADER_HEIGHT }} className="flex h-screen bg-[var(--vc-bg)] overflow-x-hidden">
      {/* ===== Sidebar VIOLET ===== */}
      <aside
        id="sidebar"
        data-bornes-open={bornesOpen}
        className={`fixed left-0 top-0 h-screen flex flex-col transition-all duration-300 ${
          sidebarOpen ? "w-72" : "w-24"
        } overflow-y-auto z-50 text-white shadow-lg`}
        style={{
          background: "#5B1FB4",
        }}
      >
        {/* Logo + Menu */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/20">
          <div
            className={`${
              sidebarOpen ? "w-10 h-10" : "w-12 h-12"
            } rounded-full overflow-hidden flex items-center justify-center bg-white shadow-md transition-all duration-300 relative`}
            aria-hidden
          >
            <img
              src={LogoImg}
              alt="Village Connect"
              className="w-full h-full object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            
          </div>

          <button
            onClick={() => setSidebarOpen((s) => !s)}
            className="flex items-center gap-2 text-white hover:text-red-500 focus:outline-none transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg
              className="w-5 h-5 icon-strong hover:scale-125 transition-transform"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span
              className={`text-lg font-semibold whitespace-nowrap transition-all duration-300 ${
                sidebarOpen ? "opacity-100" : "opacity-0 hidden"
              }`}
            >
              Menu
            </span>
          </button>
        </div>

        {/* === NAVIGATION === */}
        <nav className="flex-1 overflow-auto px-2 py-4">
          <SidebarLink to="/dashboard" label="Accueil" icon={HomeIcon} sidebarOpen={sidebarOpen} />
          <SidebarLink to="/groupe-login" label="Gestion des utilisateurs" icon={UserIcon} sidebarOpen={sidebarOpen} />


          

          {/* === Bornes === */}
          <div className="mt-3">
            <button
              onClick={() => setBornesOpen((s) => !s)}
              className="w-full px-3 py-2 flex items-center justify-between gap-3 text-sm font-semibold rounded transition-colors hover:text-red-500"
            >
              <div className="flex items-center gap-3">
                <AntennaIcon className={`icon-strong transition-all ${sidebarOpen ? "w-5 h-5" : "w-6 h-6"}`} />
                <span
                  className={`whitespace-nowrap transition-all duration-300 ${
                    sidebarOpen ? "opacity-100" : "opacity-0 hidden"
                  }`}
                >
                  Gestion des bornes
                </span>
              </div>

              <svg
                className={`w-4 h-4 transform transition-all ${bornesOpen ? "rotate-90" : "rotate-0"} ${
                  sidebarOpen ? "opacity-100" : "opacity-0 hidden"
                }`}
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
              >
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 6l6 4-6 4" />
              </svg>
            </button>

            {/* Sous-menu bornes */}
            <div
              id="bornes-subnav"
              className={`ml-8 flex flex-col text-sm space-y-1 mt-2 transition-all duration-300 overflow-hidden ${
                bornesOpen && sidebarOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              {subLinks.map((l, i) => (
                <SidebarSubLink key={i} to={l.to} label={l.label} />
              ))}
            </div>
          </div>

          {/* === Autres liens === */}
          <div className="mt-5">
            <SidebarLink to="/gestions-des-transactions" label="Gestions des transactions" icon={ChartIcon} sidebarOpen={sidebarOpen} />
            <SidebarLink to="/statistiques" label="Statistiques" icon={StatsIcon} sidebarOpen={sidebarOpen} />
            <SidebarLink to="/gestions-des-agents" label="Gestions des agents" icon={AgentsIcon} sidebarOpen={sidebarOpen} />
            <SidebarLink to="/creation-de-forfaits" label="Création de forfaits" icon={BookIcon} sidebarOpen={sidebarOpen} />
            <SidebarLink to="/generer-code-de-connexions" label="Générer code de connexions" icon={CodeIcon} sidebarOpen={sidebarOpen} />
          </div>
        </nav>
      </aside>

      {/* ===== Contenu principal =====
          Le header est fixé en haut ; on rajoute un padding-top égal à --vc-header-height
          pour que le contenu (titres) ne soit pas recouvert. */}
      <div
        className={`flex-1 flex flex-col relative transition-all duration-300 ${sidebarOpen ? "ml-72" : "ml-24"}`}
        style={{ paddingTop: "var(--vc-header-height)" }}
      >
        {/* Header (fixe) */}
        <div className="fixed top-0 left-0 right-0 z-40" style={{ height: "var(--vc-header-height)" }}>
          <Header sidebarOpen={sidebarOpen} />
        </div>

        <PageLogo />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

/*
      |            SOUS-LIENS BORNES ICI            | */
export const subLinks = [
  { to: "/users", label: "Gestion des accès utilisateurs" },
  { to: "/alertes", label: "Gestion des alertes" },
  { to: "/consultation-des-alertes", label: "Consultations des alertes" },
  { to: "/gestion-des-bornes-wifi", label: "Gestion des bornes Wi-Fi" },
];

/* ===== Liens Sidebar ===== */
function SidebarLink({ to, label, icon: Icon, sidebarOpen }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded transition-colors duration-200 hover:text-red-500 ${
          isActive ? "text-red-500 font-semibold" : "text-white"
        }`
      }
      title={!sidebarOpen ? label : ""}
    >
      {Icon && <Icon className="w-6 h-6 transition-colors" />}
      <span className={`text-sm whitespace-nowrap ${sidebarOpen ? "opacity-100" : "opacity-0 hidden"}`}>{label}</span>
    </NavLink>
  );
}

/* ===== Sous-liens ===== */
function SidebarSubLink({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-2 py-1 rounded text-sm transition-colors duration-200 hover:text-red-500 ${
          isActive ? "text-red-500 font-semibold" : "text-white"
        }`
      }
    >
      {label}
    </NavLink>
  );
}

/* ===== Icônes ===== */
function HomeIcon(props) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>;
}

function UserIcon(props) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16 14a4 4 0 10-8 0v2h8v-2zM12 6a3 3 0 110 6 3 3 0 010-6z"/></svg>;
}

function AntennaIcon(props) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 20v-8M8 12a4 4 0 018 0M5 9a7 7 0 0114 0"/></svg>;
}

function ChartIcon(props) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M9 14l3-4 2 3 3-6"/></svg>;
}

function StatsIcon(props) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 13v6M12 8v11M17 4v15"/></svg>;
}

function AgentsIcon(props) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16 11a4 4 0 10-8 0M12 15v6M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2"/></svg>;
}

function BookIcon(props) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 7a4 4 0 014-4h10v14a2 2 0 01-2 2H7a4 4 0 01-4-4V7z"/></svg>;
}

function CodeIcon(props) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16 18l6-6-6-6M8 6L2 12l6 6"/></svg>;
}

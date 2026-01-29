import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import Header from "./header1";
import PageLogo from "./PageLogo/PageLogo";

export default function NavbarAgent({ children, sidebarOpen = true, onSidebarToggle }) {
  const [open, setOpen] = useState(sidebarOpen);

  useEffect(() => {
    if (onSidebarToggle) onSidebarToggle(open);
  }, [open, onSidebarToggle]);

  const HEADER_HEIGHT = "64px";

  return (
    <div style={{ ["--vc-header-height"]: HEADER_HEIGHT }} className="flex h-screen bg-[var(--vc-bg)] overflow-x-hidden">
      <aside
        id="navbar-admin"
        className={`fixed left-0 top-0 h-screen z-50 transition-all duration-300 text-white ${
          open ? "w-[19rem]" : "w-24"
        } overflow-y-auto`}
        style={{ background: "#5B1FB4" }}
        aria-label="Barre latérale admin"
      >
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
          <div className={`rounded-full overflow-hidden bg-white ${open ? "w-10 h-10" : "w-9 h-9"}`} aria-hidden>
            <img src="/logo-village.jpeg" alt="Village Connect" className="w-full h-full object-cover" />
          </div>
          <button
            onClick={() => setOpen((s) => !s)}
            className="flex items-center gap-2 text-white hover:text-red-500 focus:outline-none transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg
              className="w-5 h-5 icon-strong hover:scale-105 transition-transform"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span
              className={`text-lg font-semibold whitespace-nowrap transition-all duration-300 ${
                open ? "opacity-100" : "opacity-0 hidden"
              }`}
            >
              Menu
            </span>
          </button>
        </div>

        <nav className="px-2 py-4 flex-1 flex flex-col gap-2">
          <NavItem to="/dashboard" label="Accueil" sidebarOpen={open} icon={HomeIcon} />
          <NavItem to="/users" label="Gestion des accès utilisateurs" sidebarOpen={open} icon={UserIcon} />
          <NavItem to="/alertes" label="Gestion des alertes" sidebarOpen={open} icon={AlertIcon} />
          <NavItem to="/gestion-des-bornes-wifi" label="Gestion des bornes Wi‑Fi" sidebarOpen={open} icon={AntennaIcon} />
          <NavItem to="/gestions-des-transactions" label="Gestion des transactions" sidebarOpen={open} icon={ChartIcon} />
          <NavItem to="/statistiques" label="Statistiques" sidebarOpen={open} icon={StatsIcon} />
          <NavItem to="/creation-de-forfaits" label="Création de forfaits" sidebarOpen={open} icon={BookIcon} />
          <NavItem to="/generer-code-de-connexions" label="Générer des codes de connexion" sidebarOpen={open} icon={CodeIcon} />
        </nav>
      </aside>

      <div className={`flex-1 flex flex-col relative transition-all duration-300 ${open ? "ml-[19rem]" : "ml-24"}`} style={{ paddingTop: "var(--vc-header-height)" }}>
        <div className="fixed top-0 left-0 right-0 z-40" style={{ height: "var(--vc-header-height)" }}>
          <Header sidebarOpen={open} />
        </div>

        <PageLogo />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

function NavItem({ to, label, sidebarOpen, icon: Icon }) {
  return (
    <NavLink
      to={to}
      onClick={(e) => {
        if (window.location.pathname === to) {
          e.preventDefault();
          window.location.href = to;
        }
      }}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded transition-colors duration-200 hover:bg-white/6 ${
          isActive ? "text-red-500 font-semibold bg-white/6" : "text-white"
        }`
      }
      title={!sidebarOpen ? label : ""}
    >
      {Icon && <Icon className="w-6 h-6 flex-shrink-0 text-white" />}
      <span className={`text-base whitespace-nowrap transition-all duration-200 ${sidebarOpen ? "opacity-100" : "opacity-0 hidden"}`}>
        {label}
      </span>
    </NavLink>
  );
}

/* Icon components copied locally to keep navbar self-contained */
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

function AlertIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
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

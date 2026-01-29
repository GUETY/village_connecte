import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { NavLink, useLocation } from "react-router-dom";
import Header from "./header1";
import NavbarAdmin from "./navbar_admin";
import NavbarAgent from "./navbar_agent";
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
  const { user, role } = useAuth();

  // Si role admin, déléguer l'affichage à NavbarAdmin (préserve children)
  if (role === "admin") {
    return (
      <NavbarAdmin sidebarOpen={sidebarOpen} onSidebarToggle={onSidebarToggle}>
        {children}
      </NavbarAdmin>
    );
  }
  // Si role agent, déléguer à NavbarAgent
  if (role === "agent") {
    return (
      <NavbarAgent sidebarOpen={sidebarOpen} onSidebarToggle={onSidebarToggle}>
        {children}
      </NavbarAgent>
    );
  }

  
}

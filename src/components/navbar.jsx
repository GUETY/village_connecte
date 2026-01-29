import React, { useState, useEffect } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import Header from "./header";
import { useAuth } from "../hooks/useAuth";
import NavbarAdmin from "./navbar_admin";
import NavbarAgent from "./navbar_agent";

/**
 * Navbar réutilisable — header retiré d'ici (header.jsx gère le titre dynamique)
 * - icônes agrandies quand sidebar fermée
 * - animations hover / glow
 */
export default function Navbar({ children }) {
  const { role } = useAuth();

  // Si admin ou agent, déléguer à la navbar correspondante
  if (role === "admin") return <NavbarAdmin>{children}</NavbarAdmin>;
  if (role === "agent") return <NavbarAgent>{children}</NavbarAgent>;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [bornesOpen, setBornesOpen] = useState(true);
  const location = useLocation();

  

  
}
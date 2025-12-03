import React from "react";
import voisinageImg from "../assets/voisinage.jpeg"; // Import de l'image

/**
 * Composant VoisinageLogo
 * - Affiche le logo carré en haut à droite (juste en bas du header violet)
 * - Importer et placer <VoisinageLogo /> dans n'importe quelle page
 * - Position : fixed top-right pour rester visible
 *
 * Utilisation :
 * import VoisinageLogo from "../layout/voisinage.jsx";
 * <VoisinageLogo />
 */

export default function VoisinageLogo({ 
  size = "h-12 w-12", 
  ariaLabel = "Voisinage"
}) {
  return (
    <div
      aria-hidden="false"
      role="img"
      aria-label={ariaLabel}
      className="fixed top-20 right-6 z-40 animate-pulse hover:animate-none"
    >
      <div className={`bg-transparent shadow-lg transition-all duration-200 hover:scale-110 ${size} overflow-hidden`}>
        <img
          src={voisinageImg}
          alt={ariaLabel}
          className="block object-contain w-full h-full drop-shadow-lg"
        />
      </div>
    </div>
  );
}
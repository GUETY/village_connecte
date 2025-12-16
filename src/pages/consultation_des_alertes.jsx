import React, { useState, useMemo, useEffect } from "react";
import Navbar from "../components/navbar.jsx";
import "../styles/tailwind.css";
import { alertesAPI } from "../services/api.js";

// map backend status -> frontend etat
function mapStatus(status) {
  if (!status) return "encours";
  const s = String(status).toUpperCase();
  if (s === "RESOLUE") return "bon";
  if (s === "EN_COURS") return "encours";
  if (s === "NOUVELLE") return "echec";
  return "encours";
}

// map frontend etat -> backend status
function mapEtatToStatus(etat) {
  if (etat === "bon") return "RESOLUE";
  if (etat === "encours") return "EN_COURS";
  if (etat === "echec") return "NOUVELLE";
  return "EN_COURS";
}

export default function App() {
  // données initiales vides — chargées depuis l'API
  const [alerts, setAlerts] = useState([]);
  const [search, setSearch] = useState("");
  const [etatFilter, setEtatFilter] = useState("all");

  // Chargement depuis l'API externe au montage
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await alertesAPI.list();
        if (!mounted) return;

        // Mapping du schéma Mongoose fourni vers la structure utilisée par la page
        const mapped = (Array.isArray(data) ? data : []).map((item) => ({
          id: item._id || item.id,
          dateEmission: item.createdAt ? String(item.createdAt).split("T")[0] : (item.dateEmission || ""),
          emetteur: item.emitter || item.emetteur || "",
          codeType: item.type != null ? String(item.type) : (item.codeType || ""),
          code: item.code != null ? String(item.code) : (item.code || ""),
          nom: item.metadata?.identifiant || item.nom || "",
          alertes: item.message || item.alertes || "",
          dateConstat: item.updatedAt ? String(item.updatedAt).split("T")[0] : (item.dateConstat || ""),
          traite: Boolean(item.metadata?.traite),
          etat: mapStatus(item.status),
          metadata: item.metadata || {}, // garder metadata pour mises à jour
        }));
        setAlerts(mapped);
      } catch (err) {
        const status = err?.status || err?.statusCode || err?.response?.status;
        console.error("Erreur chargement alertes :", err);
        if (status === 401) {
          console.warn("401 Unauthorized — redirection vers /login");
          window.location.href = "/login";
        }
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // filtrage mémorisé
  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      const q = search.trim().toLowerCase();
      if (q) {
        const hay = `${a.dateEmission} ${a.emetteur} ${a.codeType} ${a.code} ${a.nom} ${a.alertes}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (etatFilter !== "all" && a.etat !== etatFilter) return false;
      return true;
    });
  }, [alerts, search, etatFilter]);

  // basculer traité/non traité (optimiste + PATCH via alertesAPI)
  async function toggleTraite(id) {
    // update local optimiste
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, traite: !a.traite } : a)));

    // déterminer nouvelle valeur pour envoyer au backend
    const current = alerts.find((a) => a.id === id) || {};
    const newTraite = !Boolean(current.traite);
    const metadata = { ...(current.metadata || {}), traite: newTraite };

    try {
      await alertesAPI.update(id, { metadata });
    } catch (err) {
      const status = err?.status || err?.statusCode || err?.response?.status;
      console.error("Erreur mise à jour traite :", err);
      // rollback
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, traite: current ? Boolean(current.traite) : false } : a)));
      if (status === 401) {
        window.location.href = "/login";
      }
    }
  }

  // changer l'état (optimiste + PATCH via alertesAPI)
  async function setEtat(id, newEtat) {
    const prevItem = alerts.find((a) => a.id === id);
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, etat: newEtat } : a)));

    try {
      await alertesAPI.update(id, { status: mapEtatToStatus(newEtat) });
    } catch (err) {
      const status = err?.status || err?.statusCode || err?.response?.status;
      console.error("Erreur mise à jour etat :", err);
      // rollback
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, etat: prevItem ? prevItem.etat : "encours" } : a)));
      if (status === 401) {
        window.location.href = "/login";
      }
    }
  }

  // valider (exemple : envoyer données au serveur)
  function handleValider() {
    console.log("Données validées :", { filtered, search, etatFilter });
    alert(`${filtered.length} alerte(s) validée(s)`);
  }

  return (
    <Navbar>
      <main className="max-w-7xl mx-auto px-6 py-8" style={{ transform: "none", perspective: "none" }}>
        {/* Contenu sans fond blanc (transparent) */}
        <div className="space-y-6">
          {/* Ligne haute : filtre état (bouton Valider supprimé) */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4" style={{ transform: "none" }}>
            {/* Espace vide à gauche */}
            <div className="flex-1 hidden md:block" />

            {/* Filtre état */}
            <div className="flex flex-wrap items-center justify-center gap-4 w-full md:w-auto">
              <div className="filter-card flex items-center gap-3">
                <div className="text-center">
                  <div className="text-sm font-semibold">Etat</div>
                </div>

                {/* Bouton Bon */}
                <button
                  className="filter-option"
                  onClick={() => setEtatFilter(etatFilter === "bon" ? "all" : "bon")}
                  aria-pressed={etatFilter === "bon"}
                  title="Filtrer par état Bon"
                >
                  <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20 6L9 17l-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-sm">Bon</span>
                </button>

                {/* Bouton En cours */}
                <button
                  className="filter-option"
                  onClick={() => setEtatFilter(etatFilter === "encours" ? "all" : "encours")}
                  aria-pressed={etatFilter === "encours"}
                  title="Filtrer par état En cours"
                >
                  <span className="inline-block w-3 h-3 rounded-full border-2 border-orange-400" />
                  <span className="text-sm">En cours</span>
                </button>

                {/* Bouton Echec */}
                <button
                  className="filter-option"
                  onClick={() => setEtatFilter(etatFilter === "echec" ? "all" : "echec")}
                  aria-pressed={etatFilter === "echec"}
                  title="Filtrer par état Echec"
                >
                  <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-sm">Echec</span>
                </button>

                {/* Indicateur visible du filtre sélectionné */}
                <div className="ml-3 text-sm font-semibold text-[#ff7a00] select-none" aria-live="polite">
                  Filtre :{" "}
                  {etatFilter === "all" ? "Tous" : etatFilter === "bon" ? "Bon" : etatFilter === "encours" ? "En cours" : "Echec"}
                </div>
              </div>
            </div>
          </div>

          {/* Barre de recherche professionnelle - RESPONSIVE */}
          <div className="flex flex-col sm:flex-row items-center gap-3" style={{ transform: "none" }}>
            <label className="sr-only">Recherche d'alerte</label>
            <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Rechercher une alerte..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="search-input w-full"
                />
                {search && (
                  <button
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setSearch("")}
                    aria-label="Effacer la recherche"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>
              <button className="btn-search whitespace-nowrap" onClick={() => setSearch(search)}>
                Recherche
              </button>
            </div>

            {/* Afficher le nombre de résultats */}
            <div className="text-sm text-gray-600 whitespace-nowrap">
              {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
            </div>
          </div>

          {/* Tableau d'alertes - RESPONSIVE AVEC SCROLL HORIZONTAL */}
          <div className="mt-6 bg-white rounded-lg overflow-x-auto shadow-sm border border-gray-200" style={{ transform: "none", perspective: "none" }}>
            <table className="w-full min-w-max" style={{ transform: "none" }}>
              {/* En-têtes */}
              <thead className="bg-[#ff7a00] text-white sticky top-0 z-10">
                <tr style={{ transform: "none" }}>
                  <th className="px-3 py-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">Date émission</th>
                  <th className="px-3 py-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">Emetteur</th>
                  <th className="px-3 py-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">Type</th>
                  <th className="px-3 py-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">Code</th>
                  <th className="px-3 py-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">Identifiant</th>
                  <th className="px-3 py-3 text-left text-xs sm:text-sm font-semibold min-w-48">Alertes</th>
                  <th className="px-3 py-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">Date constat</th>
                  <th className="px-3 py-3 text-center text-xs sm:text-sm font-semibold whitespace-nowrap">Traité</th>
                  <th className="px-3 py-3 text-center text-xs sm:text-sm font-semibold whitespace-nowrap">Etat</th>
                </tr>
              </thead>

              {/* Lignes de contenu */}
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center text-sm text-gray-400">
                      Aucune alerte correspondante
                    </td>
                  </tr>
                ) : (
                  filtered.map((a) => (
                    <tr
                      key={a.id}
                      className="hover:bg-orange-50/50 transition-colors duration-200"
                      style={{ transform: "none" }}
                    >
                      <td className="px-3 py-4 align-middle text-xs sm:text-sm text-gray-700 whitespace-nowrap">{a.dateEmission}</td>
                      <td className="px-3 py-4 align-middle text-xs sm:text-sm text-gray-700 whitespace-nowrap">{a.emetteur}</td>
                      <td className="px-3 py-4 align-middle text-xs sm:text-sm text-gray-700 whitespace-nowrap">{a.codeType}</td>
                      <td className="px-3 py-4 align-middle text-xs sm:text-sm text-gray-700 whitespace-nowrap">{a.code}</td>
                      <td className="px-3 py-4 align-middle text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">{a.nom}</td>
                      <td className="px-3 py-4 align-middle text-xs sm:text-sm text-gray-700 min-w-48 max-w-xs">{a.alertes}</td>
                      <td className="px-3 py-4 align-middle text-xs sm:text-sm text-gray-700 whitespace-nowrap">{a.dateConstat}</td>

                      {/* Bouton traité */}
                      <td className="px-3 py-4 align-middle text-center">
                        <button
                          className="inline-flex items-center justify-center hover:bg-orange-100/20 transition-colors rounded p-1"
                          onClick={() => toggleTraite(a.id)}
                          title={a.traite ? "Marquer non traité" : "Marquer traité"}
                          aria-label={`Marquer alerte ${a.id} comme ${a.traite ? "non " : ""}traité`}
                        >
                          {a.traite ? (
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20 6L9 17l-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded border-2 border-gray-400" />
                          )}
                        </button>
                      </td>

                      {/* Badges état */}
                      <td className="px-3 py-4 align-middle text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            className={`etat-badge etat-bon text-xs sm:text-sm ${a.etat === "bon" ? "active" : ""}`}
                            onClick={() => setEtat(a.id, "bon")}
                            title="Marquer comme Bon"
                            aria-label={`Marquer alerte ${a.id} comme Bon`}
                          >
                            ✓
                          </button>
                          <button
                            className={`etat-badge etat-encours text-xs sm:text-sm ${a.etat === "encours" ? "active" : ""}`}
                            onClick={() => setEtat(a.id, "encours")}
                            title="Marquer comme En cours"
                            aria-label={`Marquer alerte ${a.id} comme En cours`}
                          >
                            ◐
                          </button>
                          <button
                            className={`etat-badge etat-echec text-xs sm:text-sm ${a.etat === "echec" ? "active" : ""}`}
                            onClick={() => setEtat(a.id, "echec")}
                            title="Marquer comme Echec"
                            aria-label={`Marquer alerte ${a.id} comme Echec`}
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <style>{`
        /* Responsive tables */
        @media (max-width: 768px) {
          table {
            font-size: 0.75rem;
          }
          thead th, tbody td {
            padding: 0.5rem;
          }
        }

        @media (max-width: 640px) {
          table {
            font-size: 0.7rem;
          }
          thead th, tbody td {
            padding: 0.375rem;
          }
        }

        /* Scroll horizontal smooth */
        .overflow-x-auto {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }

        /* Styles pour les boutons de filtre et état actif */
        .filter-card { display: flex; align-items: center; gap: 0.5rem; }
        .filter-option {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.45rem 0.6rem;
          border-radius: 0.5rem;
          border: 1px solid transparent;
          background: transparent;
          cursor: pointer;
          transition: all 150ms;
          font-weight: 600;
        }
        .filter-option:hover { transform: translateY(-2px); }
        /* état visuel quand sélectionné */
        .filter-option[aria-pressed="true"] {
          background: rgba(255,122,0,0.08);
          border-color: rgba(255,122,0,0.18);
          box-shadow: 0 4px 12px rgba(255,122,0,0.06);
          transform: translateY(-1px) scale(1.01);
        }
      `}</style>
    </Navbar>
  );
}

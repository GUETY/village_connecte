import React, { useState, useEffect } from "react";
import api, { userAccessAPI, forfaitAPI } from "../../services/api";
import Navbar from "../../components/navbar1.jsx";
import { RefreshCw } from "lucide-react";

export default function GestionDesAccesUtilisateurs() {
  const [filterUserId, setFilterUserId] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tous");
  
  const [accesses, setAccesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sourceLabel, setSourceLabel] = useState("");

  // Toast d'information animé
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastError, setToastError] = useState(false);

  const showToast = (msg, isError = false, ms = 3000) => {
    setToastMessage(msg);
    setToastError(!!isError);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), ms);
  };

  // Colonnes désirées (fixes) avec correspondances possibles (inclut clés imbriquées)
  const desiredColumns = [
    {
      key: "purchasePrice",
      label: "Prix d’achat",
      candidates: [
        "purchasePrice",
        "price",
        "prixAchat",
        "prix_achat",
        "cost",
        "montant",
        "amount",
        "tarif",
        "prix",
        "total",
        "transaction.amount",
        "purchase.amount"
      ]
    },
    {
      key: "name",
      label: "Nom",
      candidates: [
        "name",
        "nom",
        "productName",
        "itemName",
        "designation",
        "libelle",
        "label",
        "title",
        "user",
        "login",
        "article",
        "produit",
        "produit.name",
        "product.name",
        "item.name",
        "article.name",
        "article.nom"
      ]
    },
    {
      key: "code",
      label: "Code",
      candidates: [
        "code",
        "sku",
        "ref",
        "reference",
        "productCode",
        "codeProduit",
        "id",
        "_id",
        "produit.code",
        "product.code",
        "item.code"
      ]
    },
    {
      key: "usage",
      label: "Utilisation",
      candidates: [
        "usage",
        "utilisation",
        "use",
        "purpose",
        "type",
        "category",
        "categorie",
        "mode",
        "modeUtilisation"
      ]
    },
    {
      key: "purchaseDate",
      label: "Date d’achat",
      candidates: [
        "purchaseDate",
        "dateAchat",
        "date",
        "createdAt",
        "purchase.date",
        "transactionDate",
        "date_achat"
      ]
    },
    {
      key: "purchaseTime",
      label: "Heure d’achat",
      candidates: [
        "purchaseTime",
        "heureAchat",
        "time",
        "createdAt",
        "purchase.time"
      ]
    },
    { key: "status", label: "Statut", candidates: ["status","etat","state"] },
    { key: "actions", label: "Actions", candidates: [] }, // Colonne dédiée pour les actions
  ];

  // Helper: récupérer première valeur correspondante (supporte clés imbriquées via "a.b.c")
  const getByPath = (obj, path) => {
    try {
      return String(path)
        .split(".")
        .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
    } catch {
      return undefined;
    }
  };

  const getField = (obj, keys) => {
    for (const k of keys) {
      const val = getByPath(obj, k);
      if (val !== undefined && val !== null) return val;
    }
    return "";
  };

  const formatValue = (v) => {
    if (v === null || v === undefined) return "";
    if (typeof v === "string") {
      if (/^\d{4}-\d{2}-\d{2}T/.test(v)) {
        const d = new Date(v);
        if (!isNaN(d)) return d.toLocaleString("fr-FR");
      }
      return v;
    }
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    if (typeof v === "object") {
      if (v.startHour || v.endHour) {
        const s = v.startHour ? String(v.startHour) : "";
        const e = v.endHour ? String(v.endHour) : "";
        return [s, e].filter(Boolean).join(" → ");
      }
      if (v.type && ("startDate" in v || "endDate" in v)) {
        const sd = v.startDate ? new Date(v.startDate) : null;
        const ed = v.endDate ? new Date(v.endDate) : null;
        const sdStr = sd && !isNaN(sd) ? sd.toLocaleDateString("fr-FR") : "";
        const edStr = ed && !isNaN(ed) ? ed.toLocaleDateString("fr-FR") : "";
        const range = (sdStr || edStr) ? ` (${sdStr}${sdStr && edStr ? ' → ' : ''}${edStr})` : "";
        return `${String(v.type)}${range}`;
      }
      if (v.name && v._id) return `${v.name} (${v._id})`;
      if (v.name) return String(v.name);
      if (v._id) return String(v._id);
      try { return JSON.stringify(v); } catch { return String(v); }
    }
    return String(v);
  };

  const getDatePart = (v) => {
    if (!v) return "";
    const d = typeof v === "string" || typeof v === "number" ? new Date(v) : v;
    return isNaN(d) ? formatValue(v) : d.toLocaleDateString("fr-FR");
  };

  const getTimePart = (v) => {
    if (!v) return "";
    const d = typeof v === "string" || typeof v === "number" ? new Date(v) : v;
    return isNaN(d) ? formatValue(v) : d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const displayValue = (item, col) => {
    const raw = getField(item, col.candidates);
    if (col.key === "purchaseDate") return getDatePart(raw);
    if (col.key === "purchaseTime") return getTimePart(raw);
    // Prix: si nombre, format local
    if (col.key === "purchasePrice" && typeof raw === "number") return raw.toLocaleString("fr-FR") + " fcfa";
    return formatValue(raw);
  };

  // Harmonisation: classes par type de colonne pour un rendu professionnel
  const headerClass = (key) => {
    const base = "py-3 font-semibold whitespace-nowrap sticky top-0 z-10 align-middle bg-orange-500";
    if (key === "purchasePrice") return `px-4 ${base} text-left w-[120px]`;
    if (key === "name") return `px-4 ${base} text-center`;
    if (key === "code") return `pl-20 pr-4 ${base} text-left min-w-[160px]`;
    if (key === "actions") return `px-4 ${base} text-center min-w-[210px]`;
    return `px-4 ${base} text-left`;
  };

  const cellClass = (key) => {
    if (key === "purchasePrice") return "px-4 py-3 text-gray-700 text-xs text-left tabular-nums w-[120px] align-middle";
    if (key === "purchaseDate" || key === "purchaseTime") return "px-4 py-3 text-gray-700 text-xs whitespace-nowrap";
    if (key === "name") return "px-4 py-3 text-gray-700 text-xs truncate max-w-[220px]";
    if (key === "code") return "px-4 py-3 text-gray-700 text-xs min-w-[160px] font-mono text-[11px]";
    if (key === "actions") return "px-4 py-3 text-xs min-w-[210px]";
    return "px-4 py-3 text-gray-700 text-xs";
  };

  // Charger les données depuis la base avec fallback d'endpoints
  const loadAccesses = async () => {
    setLoading(true);
    try {
      const attempts = [
        { fn: () => forfaitAPI.list(), source: "/forfaits" },
        { fn: () => userAccessAPI.list(), source: "/user-access" },
        { fn: () => api.get("/historique/achats").then(r => r.data), source: "/historique/achats" },
      ];

      let records = [];
      let usedSource = "";
      for (const a of attempts) {
        try {
          const res = await a.fn();
          records = Array.isArray(res) ? res : res?.data || [];
          usedSource = a.source;
          // accepter le premier endpoint qui répond (même si liste vide)
          break;
        } catch (e) {
          // essayer le suivant
        }
      }

      setAccesses(records);
      setSourceLabel(usedSource || "");
      showToast("Données actualisées");
    } catch (err) {
      console.error("Erreur lors du chargement des accès:", err);
      showToast("Erreur lors du chargement", true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccesses();
  }, []);

  const handleActualiser = () => {
    loadAccesses();
  };

  // Actions par ligne: Bloquer / Activer / Renouveler
  const updateRowStatusLocal = (row, newStatus) => {
    try {
      setAccesses((prev) => prev.map((r) => {
        const rid = r.id ?? r._id;
        const rowId = row.id ?? row._id;
        return rid && rowId ? (rid === rowId ? { ...r, status: newStatus } : r) : (r === row ? { ...r, status: newStatus } : r);
      }));
    } catch {}
  };

  const persistStatusIfPossible = async (row, newStatus) => {
    try {
      const id = row.id ?? row._id;
      if (!id) return;
      if (sourceLabel === "/forfaits") {
        await forfaitAPI.update(id, { status: newStatus });
      }
    } catch (e) {
      console.warn("Persist status failed", e);
      showToast("Échec de la mise à jour du statut côté serveur", true);
    }
  };

  const handleBlock = async (row) => {
    const status = "Suspendu";
    updateRowStatusLocal(row, status);
    showToast("Accès bloqué (statut: Suspendu)");
    await persistStatusIfPossible(row, status);
  };

  const handleActivate = async (row) => {
    const status = "Actif";
    updateRowStatusLocal(row, status);
    showToast("Accès activé (statut: Actif)");
    await persistStatusIfPossible(row, status);
  };

  const handleRenew = async (row) => {
    showToast("Renouvellement demandé");
  };

  

  // Filtrer les accès (conserve les filtres existants)
  const filteredAccesses = accesses.filter((item) => {
    const priceVal = getField(item, [
      "purchasePrice",
      "price",
      "prixAchat",
      "prix_achat",
      "cost",
      "montant",
      "amount",
      "tarif",
      "prix",
      "total",
      "transaction.amount",
      "purchase.amount",
    ]);

    // Récupération de la date d'achat (clé imbriquée possible) et normalisation au format YYYY-MM-DD
    const dateRaw = getField(item, [
      "purchaseDate",
      "dateAchat",
      "date",
      "createdAt",
      "purchase.date",
      "transactionDate",
      "date_achat",
    ]);
    const normalizeYYYYMMDD = (v) => {
      if (!v) return "";
      const d = typeof v === "string" || typeof v === "number" ? new Date(v) : v;
      return isNaN(d) ? "" : new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10);
    };
    const itemDate = normalizeYYYYMMDD(dateRaw);

    const statusVal = getField(item, ["status","etat","state"]) || "";

    const input = String(filterUserId || "").trim();
    let matchPrice = true;
    if (input) {
      if (priceVal === undefined || priceVal === null) {
        matchPrice = false;
      } else {
        const num = Number(input.replace(/\s/g, ""));
        if (!isNaN(num) && typeof priceVal === "number") {
          matchPrice = Number(priceVal) === num;
        } else {
          matchPrice = String(priceVal).toLowerCase().includes(input.toLowerCase());
        }
      }
    }
    // Filtre par date: si une date est saisie (format YYYY-MM-DD), comparer à la date normalisée
    const matchDate = !filterGroup || (itemDate && itemDate === filterGroup);
    const matchStatus = filterStatus === "Tous" || String(statusVal) === filterStatus;
    return matchPrice && matchDate && matchStatus;
  });

  return (
    <Navbar>
      <div className="min-h-screen pt-20 pb-10 w-full bg-white font-sans antialiased text-gray-800">
        {/* Toast animé */}
        <div aria-live="polite" className="pointer-events-none fixed inset-0 flex items-start justify-end p-6 z-50">
          <div className="w-full flex flex-col items-end">
            <div className={`transform transition-all duration-300 pointer-events-auto ${toastVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
              <div className={`${toastError ? 'bg-red-600' : 'bg-green-600'} text-white px-4 py-2 rounded shadow-lg text-sm`}>{toastMessage}</div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6">
          {sourceLabel && (
            <h1 className="text-3xl font-bold text-orange-600 text-center mb-8">Historique de Gestion des accès</h1>
          )}

          {/* SECTION FILTRAGE */}
          <div className="border-4 border-orange-500 rounded-2xl bg-yellow-50 p-6 mb-6">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-bold text-gray-700 block mb-2">FILTRER PAR PRIX D’ACHAT</label>
                <input
                  type="number"
                  placeholder="Entrez un prix d’achat"
                  value={filterUserId}
                  onChange={(e) => setFilterUserId(e.target.value)}
                  className="no-spin w-full border-2 border-orange-500 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-bold text-gray-700 block mb-2">FILTRER PAR DATE D’ACHAT</label>
                <input
                  type="date"
                  value={filterGroup}
                  onChange={(e) => setFilterGroup(e.target.value)}
                  className="w-full border-2 border-orange-500 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                />
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="text-sm font-bold text-gray-700 block mb-2">STATUT</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full border-2 border-orange-500 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                >
                  <option>Tous</option>
                  <option>Actif</option>
                  <option>Inactif</option>
                  <option>Suspendu</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleActualiser}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors"
                >
                  <RefreshCw size={18} />
                  Actualiser
                </button>
              </div>
            </div>
          </div>

          {/* SECTION TABLEAU (colonnes fixes) */}
          <div className="border-4 border-orange-500 rounded-2xl bg-white p-6 max-h-[600px] overflow-y-auto">
            {filteredAccesses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">Aucun accès trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-orange-500 text-white border-b-2 border-orange-500">
                      {desiredColumns.map((col) => (
                        <th key={col.key} className={headerClass(col.key)}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccesses.map((row, idx) => (
                      <tr key={row.id || row._id || idx} className="border-b border-gray-200 hover:bg-yellow-50 transition-colors">
                        {desiredColumns.map((col) => (
                          <td key={`${idx}-${col.key}`} className={cellClass(col.key)} title={col.key === "name" ? String(displayValue(row, col)) : undefined}>
                            {col.key === "actions" ? (
                              <div className="flex items-center justify-center gap-2">
                                <button aria-label="Bloquer" onClick={() => handleBlock(row)} className="px-2 py-1 border border-red-500 text-red-600 rounded hover:bg-red-50 text-xs">Bloquer</button>
                                <button aria-label="Activer" onClick={() => handleActivate(row)} className="px-2 py-1 border border-green-600 text-green-700 rounded hover:bg-green-50 text-xs">Activer</button>
                              </div>
                            ) : (
                              displayValue(row, col)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Navbar>
  );
}

import React, { useState, useEffect, useMemo } from "react";
import Navbar from "../components/navbar";
import VoisinageLogo from "../layout/voisinage.jsx";
// import des API (doit exister dans src/services/api.js)
import { codesAPI, setAuthToken, forfaitAPI, agentsAPI } from "../services/api.js";

/**
 * Page : Générer code de connexions
 * - Sélection de catégorie forfait et forfait
 * - Génération de codes de connexion (objets conformes au schéma Code)
 * - Tableau récapitulatif des codes générés
 * - Design professionnel avec animations (inchangé)
 */

function generateConnectionCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function SuccessNotification({ message, onClose }) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 right-6 z-50 animate-slideDown">
      <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4 shadow-lg flex items-center gap-3 max-w-sm">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-green-600 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-green-800">{message}</p>
        </div>
        <button onClick={onClose} className="text-green-600 hover:text-green-800 transition-colors">
          ✕
        </button>
      </div>
    </div>
  );
}

function CodeGeneratorForm({ onGenerateCodes }) {
  const [formData, setFormData] = useState({
    categorieForfait: "",
    forfaitId: "",
    nombreCodes: "",
  });

  const [forfaitDescription, setForfaitDescription] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [forfaits, setForfaits] = useState([]);
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    // Charger et définir le token AVANT d'appeler les APIs
    const token = localStorage.getItem("village_token");
    if (token) {
      setAuthToken(token);
    }

    let mounted = true;
    (async () => {
      try {
        const f = await (forfaitAPI?.list?.() || Promise.resolve([]));
        if (mounted) setForfaits(Array.isArray(f) ? f : f?.data || []);
      } catch (err) {
        console.error("Erreur chargement forfaits :", err);
      }
      try {
        const a = await (agentsAPI?.list?.() || Promise.resolve([]));
        if (mounted) setAgents(Array.isArray(a) ? a : a?.data || []);
      } catch (err) {
        console.error("Erreur chargement agents :", err);
      }
    })();
    return () => (mounted = false);
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((s) => ({ ...s, [field]: value }));
  };

  const handleCategoryChange = (value) => {
    setFormData((s) => ({ ...s, categorieForfait: value, forfaitId: "" }));
    setForfaitDescription("");
  };

  const handleForfaitChange = (value) => {
    setFormData((s) => ({ ...s, forfaitId: value }));
    const selected = forfaits.find((f) => {
      const fId = String(f._id || f.id || "");
      return fId === String(value);
    });
    if (selected) {
      setForfaitDescription(selected.description || "");
    } else {
      setForfaitDescription("");
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);

    // récupérer les valeurs du formulaire / forfait sélectionné
    const qty = Number(formData.nombreCodes || 1);
    const selected = forfaits.find((f) => String(f._id || f.id) === String(formData.forfaitId)) || {};

    // construire le payload attendu par /codes/generate
    const payload = {
      category: formData.categorieForfait || selected.category || "default",
      forfaitId: formData.forfaitId || selected._id || selected.id || null,
      name: selected.name || formData.forfaitName || "Forfait",
      description: selected.description || forfaitDescription || formData.forfaitDescription || "",
      durationValue: Number(selected.durationValue || formData.durationValue || 0),
      durationUnit: selected.durationUnit || formData.durationUnit || "days",
      price: Number(selected.price || formData.price || 0),
      quantity: qty, // demande au backend de générer `qty` codes
    };

    // définir token si présent
    const token = localStorage.getItem("village_token");
    if (token) setAuthToken(token);

    try {
      // Appel principal vers /codes/generate (codesAPI.create utilise postWithFallback)
      const created = await codesAPI.create(payload);

      // le backend peut renvoyer un tableau de codes ou un objet { codes: [...] }
      const createdCodes = Array.isArray(created) ? created : (created?.codes || (created?.data && Array.isArray(created.data) ? created.data : [created]));

      // Normaliser et notifier l'UI
      const normalized = createdCodes.map((c) => ({
        code: c.code || c.value || c._id || String(c),
        forfait: c.forfait || payload.forfaitId,
        date: c.date || c.createdAt || new Date().toISOString(),
        price: c.price ?? payload.price,
        used: c.used ?? false,
        ...c,
      }));

      onGenerateCodes(normalized);
      setSuccessMessage(`✓ ${normalized.length} code(s) généré(s) avec succès (serveur).`);
      setShowSuccess(true);
      // reset formulaire
      setFormData({ categorieForfait: "", forfaitId: "", nombreCodes: "10" });
      setForfaitDescription("");
    } catch (err) {
      console.warn("API /codes/generate failed, fallback local generation", err);
      // fallback local : génération côté client si l'API échoue
      const generated = [];
      for (let i = 0; i < qty; i++) {
        const codeStr = generateConnectionCode();
        generated.push({
          code: codeStr,
          forfait: payload.forfaitId,
          category: payload.category,
          durationValue: payload.durationValue,
          price: payload.price,
          generatedBy: null,
          used: false,
          date: new Date().toISOString(),
          forfaitName: payload.name,
        });
      }
      onGenerateCodes(generated);
      setSuccessMessage(`✓ ${generated.length} code(s) généré(s) localement (fallback).`);
      setShowSuccess(true);
      setFormData({ categorieForfait: "", forfaitId: "", nombreCodes: "10" });
      setForfaitDescription("");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrer forfaits par catégorie sélectionnée
  const forfaitsFiltres = useMemo(() => {
    if (!formData.categorieForfait || forfaits.length === 0) return [];
    return forfaits.filter((f) => {
      const fCategory = f.category || f.categorieForfait || "";
      return String(fCategory).toLowerCase() === String(formData.categorieForfait).toLowerCase();
    });
  }, [forfaits, formData.categorieForfait]);

  return (
    <>
      {showSuccess && (
        <SuccessNotification message={successMessage} onClose={() => setShowSuccess(false)} />
      )}

      <div className="bg-white rounded-lg p-4 md:p-5 mb-5 border border-gray-200 shadow-sm">
        <h2 className="text-sm md:text-base font-bold text-gray-900 mb-4">Générateur de codes</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Ligne 1 : Catégorie et Forfait */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
            {/* Catégorie */}
            <div className="flex flex-col">
              <label htmlFor="select-category" className="text-xs md:text-sm font-semibold text-gray-700 mb-1">
                Catégorie forfait *
              </label>
              <select
                id="select-category"
                name="categorieForfait"
                value={formData.categorieForfait}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="px-2 md:px-3 py-1.5 border-2 border-[#ff7a00] rounded text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#ff7a00] bg-white cursor-pointer transition-all hover:border-[#ff9933]"
              >
                <option value="">-- Sélectionner une catégorie --</option>
                <option value="Hebdomadaire">Hebdomadaire</option>
                <option value="Mensuel">Mensuel</option>
                <option value="Illimité">Illimité</option>
                <option value="Spécial">Spécial</option>
              </select>
            </div>

            {/* Forfait */}
            <div className="flex flex-col">
              <label htmlFor="select-forfait" className="text-xs md:text-sm font-semibold text-gray-700 mb-1">
                Forfait *
              </label>
              <select
                id="select-forfait"
                name="forfaitId"
                value={formData.forfaitId}
                onChange={(e) => handleForfaitChange(e.target.value)}
                disabled={!formData.categorieForfait}
                className="px-2 md:px-3 py-1.5 border-2 border-[#ff7a00] rounded text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#ff7a00] bg-white cursor-pointer transition-all hover:border-[#ff9933] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">-- Sélectionner un forfait --</option>
                {forfaitsFiltres.length > 0 ? (
                  forfaitsFiltres.map((forfait) => (
                    <option key={String(forfait._id || forfait.id)} value={String(forfait._id || forfait.id)}>
                      {forfait.name || forfait.nom || "Sans nom"}
                    </option>
                  ))
                ) : (
                  <option disabled>Aucun forfait disponible</option>
                )}
              </select>
            </div>
          </div>

          {/* Description du forfait */}
          {forfaitDescription && (
            <div className="p-2 md:p-3 bg-orange-50 border-2 border-[#ff7a00] rounded animate-slideIn text-xs md:text-sm">
              <p className="font-semibold text-gray-700 mb-1">Description :</p>
              <p className="text-gray-700">{forfaitDescription}</p>
            </div>
          )}

          {/* Ligne 2 : Génération et Validation */}
          <div className="flex flex-col sm:flex-row gap-2 items-end">
            <div className="flex-1 flex items-end gap-1.5">
              <div className="flex-1">
                <label htmlFor="input-nombrecodes" className="text-xs md:text-sm font-semibold text-gray-700 mb-1 block">
                  Générer
                </label>
                <input
                  id="input-nombrecodes"
                  name="nombreCodes"
                  type="number"
                  value={formData.nombreCodes}
                  onChange={(e) => handleInputChange("nombreCodes", e.target.value)}
                  className="w-full px-2 md:px-3 py-1.5 border-2 border-[#ff7a00] rounded text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#ff7a00] transition-all hover:border-[#ff9933]"
                  placeholder="10"
                  min="1"
                  max="1000"
                />
              </div>
              <span className="text-xs md:text-sm font-semibold text-gray-700 mb-1 whitespace-nowrap">code(s)</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 md:px-6 py-1.5 md:py-2 bg-[#ff7a00] text-white font-bold text-sm md:text-base rounded hover:bg-[#ff9933] shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95 w-full sm:w-auto whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden"
            >
              <span className={`transition-all ${isSubmitting ? "opacity-0" : "opacity-100"}`}>
                Valider
              </span>
              {isSubmitting && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function CodesTable({ codes, onCopyCode }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Filtrer les codes (adapté aux nouvelles clés)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return codes;
    return codes.filter((code) => {
      return (
        (String(code.code || "")).toLowerCase().includes(q) ||
        (String(code.category || "")).toLowerCase().includes(q) ||
        (String(code.forfaitName || code.forfait?.name || code.forfait || "")).toLowerCase().includes(q) ||
        (String(code.generatedBy || code.generatedByName || "")).toLowerCase().includes(q) ||
        (String(code.date || "")).toLowerCase().includes(q)
      );
    });
  }, [codes, search]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm" style={{ transform: "none", perspective: "none" }}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 border-b border-gray-100">
        <div className="text-xs md:text-sm text-gray-600 whitespace-nowrap">
          Affichage {total === 0 ? 0 : start + 1}–{Math.min(start + pageSize, total)} sur {total}
        </div>
        <input
          id="codes-search"
          name="codesSearch"
          type="search"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="px-3 py-1.5 border-2 border-green-300 rounded text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-green-300 w-full sm:w-48 transition-all"
          aria-label="Recherche codes"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200 text-xs md:text-sm" role="table" aria-label="Tableau des codes générés" style={{ transform: "none" }}>
          <caption className="sr-only">Liste des codes de connexion générés</caption>
          <thead className="bg-[#ff7a00] text-white sticky top-0 z-10">
            <tr style={{ transform: "none" }}>
              <th className="px-2 md:px-3 py-2 text-left font-semibold whitespace-nowrap">Date</th>
              <th className="px-2 md:px-3 py-2 text-left font-semibold whitespace-nowrap">Code</th>
              <th className="px-2 md:px-3 py-2 text-left font-semibold whitespace-nowrap">Catégorie</th>
              <th className="px-2 md:px-3 py-2 text-left font-semibold whitespace-nowrap">Forfait</th>
              <th className="px-2 md:px-3 py-2 text-left font-semibold whitespace-nowrap">Durée</th>
              <th className="px-2 md:px-3 py-2 text-left font-semibold whitespace-nowrap">Montant</th>
              <th className="px-2 md:px-3 py-2 text-left font-semibold whitespace-nowrap">Agent</th>
              <th className="px-2 md:px-3 py-2 text-left font-semibold whitespace-nowrap">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {paginated.length > 0 ? (
              paginated.map((code, idx) => {
                const actualIndex = start + idx;
                return (
                  <tr
                    key={actualIndex}
                    className={`${code.used ? "bg-gray-50 opacity-60" : "hover:bg-orange-50/50"} transition-colors duration-200 animate-fadeIn`}
                    style={{ animationDelay: `${idx * 50}ms`, transform: "none" }}
                  >
                    <td className="px-2 md:px-3 py-2 align-middle text-gray-700 whitespace-nowrap">{code.date || new Date(code.createdAt || code.updatedAt || Date.now()).toLocaleDateString("fr-FR")}</td>
                    <td className="px-2 md:px-3 py-2 align-middle">
                      <code className="text-xs font-bold text-[var(--vc-purple)] bg-purple-50 px-1 md:px-2 py-0.5 rounded inline-block">
                        {code.code}
                      </code>
                    </td>
                    <td className="px-2 md:px-3 py-2 align-middle">
                      <span className="inline-block px-1 md:px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-semibold whitespace-nowrap">
                        {code.category || "-"}
                      </span>
                    </td>
                    <td className="px-2 md:px-3 py-2 align-middle font-semibold text-gray-900 whitespace-nowrap text-xs md:text-sm truncate">{code.forfaitName || (code.forfait?.name || code.forfait) || "-"}</td>
                    <td className="px-2 md:px-3 py-2 align-middle text-gray-700 whitespace-nowrap text-xs md:text-sm">{code.durationValue || "-"}</td>
                    <td className="px-2 md:px-3 py-2 align-middle">
                      <span className="inline-block px-1 md:px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-bold whitespace-nowrap">
                        {code.price != null ? Number(code.price).toLocaleString("fr-FR") + " FCFA" : "-"}
                      </span>
                    </td>
                    <td className="px-2 md:px-3 py-2 align-middle">
                      <code className="text-xs font-semibold text-gray-600 bg-gray-50 px-1 py-0.5 rounded inline-block whitespace-nowrap">
                        {code.generatedByName || code.generatedBy || "-"}
                      </code>
                    </td>
                    <td className="px-2 md:px-3 py-2 align-middle flex items-center gap-2">
                      <button
                        onClick={() => !code.used && onCopyCode(actualIndex, code.code)}
                        disabled={code.used}
                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-semibold transition-all whitespace-nowrap active:scale-95 ${code.used ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"}`}
                        title={code.used ? "Code déjà utilisé" : "Copier le code (marque utilisé automatiquement)"}
                      >
                        📋 {code.used ? "Déjà utilisé" : "Copier"}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="px-4 py-6 text-center text-gray-500 font-medium text-xs md:text-sm">
                  <svg className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Aucun code généré
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between gap-2 p-3 border-t border-gray-100">
          <div className="text-xs md:text-sm text-gray-600 whitespace-nowrap">
            Page {page} / {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 bg-gradient-to-r from-[#ff7a00] to-[#ff9933] text-white rounded text-xs md:text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg transition-all hover:scale-105 active:scale-95 font-semibold whitespace-nowrap disabled:hover:scale-100"
              aria-label="Page précédente"
            >
              ← Préc
            </button>
            <span className="px-2 py-1 bg-gray-100 rounded text-xs md:text-sm font-semibold text-gray-700">
              {page}/{totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 bg-gradient-to-r from-[#ff7a00] to-[#ff9933] text-white rounded text-xs md:text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg transition-all hover:scale-105 active:scale-95 font-semibold whitespace-nowrap disabled:hover:scale-100"
              aria-label="Page suivante"
            >
              Suiv →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GenererCodeDeConnexions() {
  // données d'exemple si API non disponible (ne modifie pas le style)
  const sampleForfaits = [
    {
      _id: "1",
      name: "hebdo nuit",
      category: "Hebdomadaire",
      durationValue: 7,
      price: 500,
      description: "Pass hebdo nuit 500f - navigation de 20h à 8h30 pendant 7 jours",
    },
    {
      _id: "2",
      name: "hebdo jour",
      category: "Hebdomadaire",
      durationValue: 7,
      price: 500,
      description: "Pass hebdo jour 500f - navigation de 8h30 à 20h pendant 7 jours",
    },
    {
      _id: "3",
      name: "mensuel illimité",
      category: "Mensuel",
      durationValue: 30,
      price: 1500,
      description: "Pass mensuel illimité 1500f - accès illimité 24h/24 pendant 30 jours",
    },
    {
      _id: "4",
      name: "illimité",
      category: "Illimité",
      durationValue: 0,
      price: 5000,
      description: "Pass illimité 5000f - accès illimité sans limite de temps",
    },
    {
      _id: "5",
      name: "spécial",
      category: "Spécial",
      durationValue: 3,
      price: 300,
      description: "Pass spécial 300f - accès spécial pour 3 jours",
    },
  ];

  const sampleAgents = [
    { _id: "a1", identifiant: "A001" },
    { _id: "a2", identifiant: "A002" },
    { _id: "a3", identifiant: "A003" },
    { _id: "a4", identifiant: "A004" },
  ];

  const [forfaits, setForfaits] = useState(sampleForfaits);
  const [agents, setAgents] = useState(sampleAgents);
  const [codes, setCodes] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Charger les codes depuis localStorage au montage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("village_codes_generated");
      if (saved) {
        const parsed = JSON.parse(saved);
        setCodes(Array.isArray(parsed) ? parsed : []);
      }
    } catch (err) {
      console.error("Erreur chargement codes localStorage :", err);
    }
  }, []);

  // Charger et définir le token AVANT de charger les données API
  useEffect(() => {
    const token = localStorage.getItem("village_token");
    if (token) {
      setAuthToken(token);
    }

    let mounted = true;
    (async () => {
      try {
        const f = await (forfaitAPI?.list?.() || Promise.resolve(null));
        if (mounted && f) setForfaits(Array.isArray(f) ? f : f?.data || f || sampleForfaits);
      } catch (err) {
        console.error("Erreur chargement forfaits API :", err);
        // keep sample
      }
      try {
        const a = await (agentsAPI?.list?.() || Promise.resolve(null));
        if (mounted && a) setAgents(Array.isArray(a) ? a : a?.data || a || sampleAgents);
      } catch (err) {
        console.error("Erreur chargement agents API :", err);
        // keep sample
      }
    })();
    return () => (mounted = false);
  }, []);

  const handleCopyCode = (index, code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCodes((prev) => {
        const updated = prev.map((c, i) => (i === index ? { ...c, used: true } : c));
        // sauvegarder dans localStorage
        try {
          localStorage.setItem("village_codes_generated", JSON.stringify(updated));
        } catch (err) {
          console.error("Erreur sauvegarde codes localStorage :", err);
        }
        return updated;
      });
      setSuccessMessage("✓ Code copié et marqué comme utilisé");
      setShowSuccess(true);
    }).catch(() => {
      setSuccessMessage("Erreur : impossible de copier le code");
      setShowSuccess(true);
    });
  };

  const handleGenerateCodes = (newCodes) => {
    // newCodes peuvent provenir de l'API (objets créés) ou du générateur local
    setCodes((prev) => {
      const updated = [...prev, ...newCodes];
      // sauvegarder dans localStorage pour persistance
      try {
        localStorage.setItem("village_codes_generated", JSON.stringify(updated));
      } catch (err) {
        console.error("Erreur sauvegarde codes localStorage :", err);
      }
      return updated;
    });
  };

  return (
    <Navbar>
      <VoisinageLogo />
      
      {showSuccess && <SuccessNotification message={successMessage} onClose={() => setShowSuccess(false)} />}

      <main className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 py-3 md:py-4 font-sans antialiased text-gray-800" style={{ transform: "none" }}>
        <section style={{ transform: "none" }}>
          <header className="mb-4 pb-3 border-b border-gray-200">
            <h1 className="text-lg md:text-2xl font-bold text-[var(--vc-purple)] mb-0.5">Générer codes de connexion</h1>
            <p className="text-xs md:text-sm text-gray-600">Créez rapidement des codes d'accès</p>
          </header>

          <CodeGeneratorForm onGenerateCodes={handleGenerateCodes} />

          <div>
            <h2 className="text-sm md:text-base font-bold text-gray-900 mb-3">Codes générés ({codes.length})</h2>
            <CodesTable codes={codes} onCopyCode={handleCopyCode} />
          </div>
        </section>
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; }
        .animate-slideIn { animation: slideIn 0.4s ease-out; }
        .animate-slideDown { animation: slideDown 0.4s ease-out; }
        @media (max-width: 640px) { table { font-size: 0.7rem; } }
      `}</style>
    </Navbar>
  );
}
import React, { useState, useEffect } from "react";
import Navbar from "../components/navbar";
import VoisinageLogo from "../layout/voisinage.jsx";
import { bornesAPI } from "../services/api.js"; // <-- ajouté

/**
 * Page : Gestion des Bornes Wi-Fi
 * Ajustements visuels : tableau net, entête orange pur, suppression du fond blanc interne,
 * police améliorée, boutons responsives propres.
 */

function EtatBadge({ etat }) {
  const map = {
    "EN_SERVICE": { color: "bg-green-500", label: "" },
    "INSTABLE": { color: "bg-orange-400", label: "" },
    "HORS_LIGNE": { color: "bg-red-600", label: "" },
    "": { color: "bg-red-600", label: "" },
  };
  const { color, label } = map[etat] || map["INSTABLE"];
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`w-3 h-3 rounded-full ${color}`} aria-hidden />
      <span className="text-sm">{label}</span>
    </span>
  );
}

function AccessCard({ value, onRequestChange, label, icon, selectedClass }) {
  const key = label.toLowerCase();
  const isSelected = value === key;
  return (
    <label
      className={`access-card cursor-pointer p-3 rounded-md flex flex-col items-center gap-2 text-center transition-shadow ${isSelected ? selectedClass + " shadow-sm scale-102" : "border-gray-200 bg-white"}`}
      role="radio"
      aria-checked={isSelected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onRequestChange(key);
      }}
      onClick={() => onRequestChange(key)}
    >
      <input type="radio" name="acces" checked={isSelected} onChange={() => onRequestChange(key)} className="sr-only" />
      <span className="text-2xl font-extrabold" aria-hidden="true">
        {icon}
      </span>
      <span className="text-sm">{label}</span>
    </label>
  );
}

/* --- Notification component + JS animation logic --- */
function SuccessNotification({ message, onClose, type = "success" }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const bg = type === "success" ? "bg-green-50 border-green-500" : type === "info" ? "bg-blue-50 border-blue-500" : "bg-red-50 border-red-500";
  const text = type === "success" ? "text-green-800" : type === "info" ? "text-blue-800" : "text-red-800";

  return (
    <div className="fixed top-6 right-6 z-50 animate-notifSlide">
      <div className={`${bg} rounded-lg p-4 shadow-lg flex items-center gap-3 max-w-sm border-l-4`}>
        <div className="flex-shrink-0">
          {type === "success" ? (
            <svg className="w-6 h-6 text-green-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-blue-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <p className={`text-sm font-semibold ${text}`}>{message}</p>
        </div>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-800 transition-colors" aria-label="Fermer notification">✕</button>
      </div>
    </div>
  );
}

/* Confirm dialog (used for reset) */
function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = "Oui", cancelLabel = "Annuler" }) {
  const [loading, setLoading] = useState(false);
  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      onConfirm();
      setLoading(false);
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg p-5 max-w-sm w-full shadow-lg animate-scaleUp">
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} disabled={loading} className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 transition">
            {cancelLabel}
          </button>
          <button onClick={handleConfirm} disabled={loading} className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition relative overflow-hidden">
            {loading ? <svg className="w-4 h-4 animate-spin mx-auto" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* --- Sliding panel (apparait depuis la droite) --- */
function SlidePanel({ selected, visible, onClose, requestAccessChange, requestEtatChange, onValidate, onReset, isValidating }) {
  if (!visible || !selected || !selected.name) return null;
  return (
    <>
      {/* Overlay semi-transparent */}
      <div
        className={`fixed inset-0 z-40 bg-black transition-opacity duration-300 ${visible ? "opacity-20" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide Panel */}
      <div
        role="dialog"
        aria-label={`Panneau de configuration pour ${selected.name}`}
        className={`fixed right-0 top-0 h-full z-50 transition-transform duration-400 ease-out`}
        style={{
          transform: visible ? "translateX(0)" : "translateX(100%)",
        }}
      >
        <div className="w-96 h-full bg-gradient-to-b from-white via-white to-gray-50 shadow-2xl flex flex-col border-l border-gray-100">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 bg-white flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900">{selected.name}</h2>
              <p className="text-xs text-gray-500 mt-1 font-mono">{selected.ip}</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Fermer panneau"
              className="ml-4 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Contenu scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Section État */}
            <div className="animate-fadeInUp" style={{ animationDelay: "100ms" }}>
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 11-2 0 1 1 0 012 0zm-1 4a1 1 0 100-2 1 1 0 000 2z" />
                </svg>
                <label className="text-sm font-semibold text-gray-900">État de la borne</label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => requestEtatChange("EN_SERVICE")}
                  className={`group px-3 py-3 rounded-lg text-xs font-semibold transition-all duration-200 flex flex-col items-center gap-1.5 ${
                    selected.status === "EN_SERVICE"
                      ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30 scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
                  }`}
                >
                  <span className="text-lg">✅</span>
                  <span>En service</span>
                </button>
                <button
                  onClick={() => requestEtatChange("INSTABLE")}
                  className={`group px-3 py-3 rounded-lg text-xs font-semibold transition-all duration-200 flex flex-col items-center gap-1.5 ${
                    selected.status === "INSTABLE"
                      ? "bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-500/30 scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
                  }`}
                >
                  <span className="text-lg">⚠️</span>
                  <span>Instable</span>
                </button>
                <button
                  onClick={() => requestEtatChange("HORS_LIGNE")}
                  className={`group px-3 py-3 rounded-lg text-xs font-semibold transition-all duration-200 flex flex-col items-center gap-1.5 ${
                    selected.status === "HORS_LIGNE"
                      ? "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
                  }`}
                >
                  <span className="text-lg">⛔</span>
                  <span>Hors ligne</span>
                </button>
              </div>
            </div>

            {/* Separator */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

            {/* Section Accès */}
            <div className="animate-fadeInUp" style={{ animationDelay: "200ms" }}>
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <label className="text-sm font-semibold text-gray-900">Contrôle d'accès</label>
              </div>
              <div className="space-y-2">
                <AccessCardSlide
                  value={selected.acces}
                  onRequestChange={requestAccessChange}
                  label="Autorisé"
                  icon="✔"
                  color="green"
                />
                <AccessCardSlide
                  value={selected.acces}
                  onRequestChange={requestAccessChange}
                  label="Limité"
                  icon="─"
                  color="orange"
                />
                <AccessCardSlide
                  value={selected.acces}
                  onRequestChange={requestAccessChange}
                  label="Bloqué"
                  icon="✕"
                  color="red"
                />
              </div>
            </div>

            {/* Infos supplémentaires */}
            <div className="animate-fadeInUp" style={{ animationDelay: "300ms" }}>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <p className="text-xs text-blue-700 font-medium">
                  💡 Les modifications seront appliquées au clic sur <strong>Valider</strong> ci-dessous.
                </p>
              </div>
            </div>
          </div>

          {/* Footer avec boutons */}
          <div className="px-6 py-5 border-t border-gray-100 bg-white space-y-3">
            <div className="flex items-center gap-3">
              <button
                onClick={onValidate}
                disabled={isValidating}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[var(--vc-purple)] to-[var(--vc-purple-dark)] text-white font-semibold hover:shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isValidating ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                )}
                <span>{isValidating ? "Application..." : "Valider"}</span>
              </button>

              <button
                onClick={onReset}
                disabled={isValidating}
                className="flex-1 px-4 py-2.5 rounded-lg border-2 border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 0112-7.94V2m0 20v-2.06A8 8 0 1120 12m-4-4v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span>Réinitialiser</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Les changements seront validés après confirmation
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/* --- Composant AccessCard amélioré pour la slide panel --- */
function AccessCardSlide({ value, onRequestChange, label, icon, color }) {
  const key = label.toLowerCase();
  const isSelected = value === key;

  const colorMap = {
    green: {
      bg: "bg-green-50",
      border: "border-green-300",
      text: "text-green-700",
      selectedBg: "bg-gradient-to-r from-green-500 to-green-600",
      selectedText: "text-white",
      selectedShadow: "shadow-lg shadow-green-500/20",
    },
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-300",
      text: "text-orange-700",
      selectedBg: "bg-gradient-to-r from-orange-500 to-orange-600",
      selectedText: "text-white",
      selectedShadow: "shadow-lg shadow-orange-500/20",
    },
    red: {
      bg: "bg-red-50",
      border: "border-red-300",
      text: "text-red-700",
      selectedBg: "bg-gradient-to-r from-red-500 to-red-600",
      selectedText: "text-white",
      selectedShadow: "shadow-lg shadow-red-500/20",
    },
  };

  const c = colorMap[color];

  return (
    <button
      onClick={() => onRequestChange(key)}
      className={`w-full px-4 py-3 rounded-lg border-2 font-semibold transition-all duration-200 flex items-center gap-3 ${
        isSelected
          ? `${c.selectedBg} ${c.selectedText} ${c.selectedShadow} scale-105`
          : `border-gray-200 bg-white ${c.text} hover:border-gray-300 hover:shadow-md`
      }`}
      role="radio"
      aria-checked={isSelected}
    >
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
      {isSelected && (
        <span className="ml-auto">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </span>
      )}
    </button>
  );
}

export default function GestionDesBornesWifi() {
  const [bornes, setBornes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showPanelId, setShowPanelId] = useState(null);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // notifications / UI states
  const [showSelectNotif, setShowSelectNotif] = useState(false);
  const [selectNotifMessage, setSelectNotifMessage] = useState("");
  const [selectNotifType, setSelectNotifType] = useState("success");
  const [flashId, setFlashId] = useState(null);

  const [isValidating, setIsValidating] = useState(false);
  const [showValidateNotif, setShowValidateNotif] = useState(false);
  const [validateMsg, setValidateMsg] = useState("");

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetNotif, setShowResetNotif] = useState(false);
  const [flashAll, setFlashAll] = useState(false);

  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [pendingEditId, setPendingEditId] = useState(null);

  const [pendingEtat, setPendingEtat] = useState(null);
  const [showEtatConfirm, setShowEtatConfirm] = useState(false);
  const [showEtatNotif, setShowEtatNotif] = useState(false);
  const [etatNotifMsg, setEtatNotifMsg] = useState("");
  const [etatNotifType, setEtatNotifType] = useState("success");

  const [pendingAccess, setPendingAccess] = useState(null);
  const [showAccessConfirm, setShowAccessConfirm] = useState(false);
  const [showAccessNotif, setShowAccessNotif] = useState(false);
  const [accessNotifMsg, setAccessNotifMsg] = useState("");
  const [accessNotifType, setAccessNotifType] = useState("success");

  // Charger les bornes depuis l'API au montage
  useEffect(() => {
    let mounted = true;
    async function loadBornes() {
      try {
        const data = await bornesAPI.list();
        if (!mounted) return;
        
        // Mapper les données du backend vers la structure UI
        const mapped = (Array.isArray(data) ? data : []).map((item) => ({
          id: item._id || item.id,
          name: item.name || "",
          ip: item.ip || "",
          status: item.status || "EN_SERVICE",
          traficMb: item.traffic ? Math.round(item.traffic / (1024 * 1024)) : 0, // convertir bytes en MB
          connexions: 0, // non fourni dans le schéma backend
          etat: item.status || "EN_SERVICE",
          acces: "autorisé", // non fourni dans le schéma backend (statique pour l'exemple)
          frequenceRedemarrage: 24, // non fourni dans le schéma backend
          temperature: item.temperature || 0,
          lastSeen: item.lastSeen,
        }));
        setBornes(mapped);
      } catch (err) {
        const status = err?.status || err?.statusCode || err?.response?.status;
        console.error("Erreur chargement bornes :", err);
        if (status === 401) {
          console.warn("401 Unauthorized — redirection vers /login");
          window.location.href = "/login";
        }
      } finally {
        setLoading(false);
      }
    }
    loadBornes();
    return () => { mounted = false; };
  }, []);

  const selected = bornes.find((b) => b.id === selectedId) || {};
  const selectedForPanel = bornes.find((b) => b.id === showPanelId) || {};

  const formatTraffic = (mb) => {
    if (mb >= 1024) return `${Math.round((mb / 1024) * 10) / 10} Go`;
    return `${mb} Mo`;
  };

  async function handleValidate() {
    setIsValidating(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
      setIsValidating(false);

      // Envoyer mise à jour au serveur
      const borneData = selectedForPanel;
      await bornesAPI.update(showPanelId, {
        status: borneData.status,
        // autres champs si nécessaire
      });

      const msg = `✓ Configuration appliquée pour ${selectedForPanel.name}`;
      setValidateMsg(msg);
      setShowValidateNotif(true);

      setFlashId(showPanelId);
      setTimeout(() => setFlashId(null), 700);

      setTimeout(() => {
        setShowPanelId(null);
        setSelectedId(null);
      }, 700);
    } catch (err) {
      setIsValidating(false);
      const status = err?.status || err?.statusCode || err?.response?.status;
      setValidateMsg("Erreur lors de l'application");
      setShowValidateNotif(true);
      if (status === 401) {
        window.location.href = "/login";
      }
    }
  }

  // selection handler
  function selectBorne(id) {
    // Si on clique sur la même borne sélectionnée, on désélectionne
    if (selectedId === id) {
      setSelectedId(null);
      setShowPanelId(null);
      setSelectNotifMessage("Sélection annulée");
      setSelectNotifType("info");
      setShowSelectNotif(true);
      return;
    }

    const b = bornes.find((x) => x.id === id);
    if (!b) return;

    // Marquer comme sélectionnée
    setSelectedId(id);

    // show flash on row
    setFlashId(id);
    setTimeout(() => setFlashId(null), 700);

    // build summary message
    const msg = `Zone sélectionnée : ${b.name} — IP ${b.ip} · État : ${b.status} · Accès : ${b.acces}`;
    setSelectNotifMessage(msg);
    setSelectNotifType("success");
    setShowSelectNotif(true);

    // Ouvrir le dialog de confirmation pour édition
    setPendingEditId(id);
    setShowEditConfirm(true);
  }

  // Confirmation : l'utilisateur veut éditer la borne
  function handleConfirmEdit() {
    setShowEditConfirm(false);
    if (pendingEditId) {
      setShowPanelId(pendingEditId); // Afficher la barre latérale
    }
    setPendingEditId(null);
  }

  // Confirmation annulée : la borne reste sélectionnée, pas de barre latérale
  function handleCancelEdit() {
    setShowEditConfirm(false);
    setPendingEditId(null);
    // selectedId reste, showPanelId reste null
  }

  // reset confirm handler
  function confirmReset() {
    // Reload depuis l'API
    setLoading(true);
    bornesAPI.list()
      .then((data) => {
        const mapped = (Array.isArray(data) ? data : []).map((item) => ({
          id: item._id || item.id,
          name: item.name || "",
          ip: item.ip || "",
          status: item.status || "EN_SERVICE",
          traficMb: item.traffic ? Math.round(item.traffic / (1024 * 1024)) : 0,
          connexions: 0,
          etat: item.status || "EN_SERVICE",
          acces: "autorisé",
          frequenceRedemarrage: 24,
          temperature: item.temperature || 0,
        }));
        setBornes(mapped);
        setSelectedId(null);
        setShowPanelId(null);
        setSearch("");
        setPage(1);
        setPageSize(5);
        setShowResetConfirm(false);
        setShowResetNotif(true);
        setFlashAll(true);
        setTimeout(() => setFlashAll(false), 700);
      })
      .catch((err) => {
        console.error("Erreur reset :", err);
        setShowResetConfirm(false);
      })
      .finally(() => setLoading(false));
  }

  function cancelReset() {
    setShowResetConfirm(false);
  }

  // Demande de changement d'état
  function requestEtatChange(nextEtat) {
    setPendingEtat(nextEtat);
    setShowEtatConfirm(true);
  }

  // Confirmation acceptée pour changement d'état
  function handleConfirmEtat() {
    setShowEtatConfirm(false);
    if (!pendingEtat) return;
    setBornes((prev) => prev.map((b) => (b.id === showPanelId ? { ...b, status: pendingEtat, etat: pendingEtat } : b)));
    setEtatNotifMsg(`✓ État modifié en "${pendingEtat}" pour ${selectedForPanel.name || "la borne"}`);
    setEtatNotifType("success");
    setShowEtatNotif(true);
    setFlashId(showPanelId);
    setTimeout(() => setFlashId(null), 700);
    setPendingEtat(null);

    setTimeout(() => {
      setShowPanelId(null);
      setSelectedId(null);
    }, 800);
  }

  // Confirmation annulée pour changement d'état
  function handleCancelEtat() {
    setShowEtatConfirm(false);
    setEtatNotifMsg("❌ Changement d'état annulé");
    setEtatNotifType("info");
    setShowEtatNotif(true);
    setPendingEtat(null);
  }

  // demande de changement d'accès
  function requestAccessChange(nextAccess) {
    if (nextAccess === selectedForPanel.acces) {
      setAccessNotifMsg("Aucun changement : accès déjà « " + nextAccess + " »");
      setAccessNotifType("info");
      setShowAccessNotif(true);
      return;
    }
    setPendingAccess(nextAccess);
    setShowAccessConfirm(true);
  }

  // Confirmation acceptée pour changement d'accès
  function handleConfirmAccess() {
    setShowAccessConfirm(false);
    if (!pendingAccess) return;
    setBornes((prev) => prev.map((b) => (b.id === showPanelId ? { ...b, acces: pendingAccess } : b)));
    setAccessNotifMsg(`✓ Accès mis à jour : ${pendingAccess} pour ${selectedForPanel.name || "la borne"}`);
    setAccessNotifType("success");
    setShowAccessNotif(true);
    setFlashId(showPanelId);
    setTimeout(() => setFlashId(null), 700);
    setPendingAccess(null);

    setTimeout(() => {
      setShowPanelId(null);
      setSelectedId(null);
    }, 800);
  }

  // Confirmation annulée pour changement d'accès
  function handleCancelAccess() {
    setShowAccessConfirm(false);
    setAccessNotifMsg("❌ Changement d'accès annulé");
    setAccessNotifType("info");
    setShowAccessNotif(true);
    setPendingAccess(null);
  }

  // Filtering & pagination
  const q = search.trim().toLowerCase();
  const filtered = bornes.filter((b) => {
    if (!q) return true;
    return (
      b.name.toLowerCase().includes(q) ||
      b.ip.toLowerCase().includes(q) ||
      String(b.connexions).includes(q) ||
      b.status.toLowerCase().includes(q) ||
      (b.acces || "").toLowerCase().includes(q)
    );
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (page > totalPages) setPage(totalPages);
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  if (loading) {
    return (
      <Navbar>
        <main className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-8 h-8 animate-spin mx-auto mb-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <p className="text-gray-600">Chargement des bornes...</p>
          </div>
        </main>
      </Navbar>
    );
  }

  return (
    <Navbar>
      <main className="max-w-6xl mx-auto px-6 py-8 font-sans antialiased text-gray-800">
        <section className="rounded-lg p-6">
          <header className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center">
                <VoisinageLogo />
              </div>
              <h1 className="text-2xl font-bold text-[var(--vc-purple)]">Village: Yaou</h1>
            </div>
          </header>

          {/* notifications */}
          {showSelectNotif && (
            <SuccessNotification
              message={selectNotifMessage}
              onClose={() => setShowSelectNotif(false)}
              type={selectNotifType}
            />
          )}
          {showValidateNotif && (
            <SuccessNotification
              message={validateMsg}
              onClose={() => setShowValidateNotif(false)}
              type="success"
            />
          )}
          {showResetNotif && (
            <SuccessNotification
              message={"✓ Réinitialisation effectuée avec succès"}
              onClose={() => setShowResetNotif(false)}
              type="success"
            />
          )}
          {showEtatNotif && (
            <SuccessNotification
              message={etatNotifMsg}
              onClose={() => setShowEtatNotif(false)}
              type={etatNotifType}
            />
          )}
          {showAccessNotif && (
            <SuccessNotification
              message={accessNotifMsg}
              onClose={() => setShowAccessNotif(false)}
              type={accessNotifType}
            />
          )}

          {/* Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-700">Afficher</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-3 py-1 border rounded-md text-sm focus:outline-none"
                aria-label="Nombre d'entrées"
              >
                {[5,10,25,50].map((n)=> <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="text-sm text-gray-700">entrées</span>
              <span className="ml-4 text-sm text-gray-500">Résultats : {total}</span>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="search-borne" className="sr-only">Recherche</label>
              <input
                id="search-borne"
                type="search"
                placeholder="Recherche : nom, ip, état..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="px-4 py-2 border-2 border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-300 w-64"
              />
            </div>
          </div>

          {/* Tableau */}
          <div className={`border border-[#ff7a00] rounded-md overflow-x-hidden ${flashAll ? "reset-flash" : ""}`} style={{ transform: "none" }}>
            <table className="min-w-full divide-y divide-gray-200 table-fixed" role="table" aria-label="Tableau des bornes Wi-Fi" style={{ transform: "none" }}>
              <caption className="sr-only">Liste des bornes Wi‑Fi avec détails techniques et état</caption>
              <thead className="bg-[#ff7a00] text-white">
                <tr>
                  <th className="w-12 px-4 py-3 text-left text-sm font-semibold">Sélection</th>
                  <th className="w-40 px-4 py-3 text-left text-sm font-semibold">Nom</th>
                  <th className="w-40 px-4 py-3 text-left text-sm font-semibold">Adresse IP</th>
                  <th className="w-32 px-4 py-3 text-left text-sm font-semibold">Trafic</th>
                  <th className="w-24 px-4 py-3 text-left text-sm font-semibold">Connexions</th>
                  <th className="w-32 px-4 py-3 text-left text-sm font-semibold">État</th>
                  <th className="w-32 px-4 py-3 text-left text-sm font-semibold">Accès</th>
                  <th className="w-28 px-4 py-3 text-left text-sm font-semibold">Redémarrage (h)</th>
                  <th className="w-20 px-4 py-3 text-left text-sm font-semibold">Temp. (°C)</th>
                  <th className="w-28 px-4 py-3 text-left text-sm font-semibold">Action</th>
                </tr>
              </thead>

              <tbody className="bg-transparent divide-y divide-gray-100">
                {paginated.map((b) => {
                  const isSelected = selectedId === b.id;
                  return (
                    <tr
                      key={b.id}
                      className={`${isSelected ? "ring-2 ring-[#ffd8b3]" : ""} cursor-pointer hover:bg-[#fff7ef] ${flashId === b.id ? "select-flash" : ""}`}
                      onClick={() => selectBorne(b.id)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") selectBorne(b.id);
                      }}
                    >
                      <td className="px-4 py-3 align-middle">
                        <input
                          type="radio"
                          name="selectedBorne"
                          checked={isSelected}
                          onChange={() => selectBorne(b.id)}
                          className="accent-[#ff7a00]"
                          aria-label={`Sélectionner ${b.name}`}
                        />
                      </td>

                      <td className="px-4 py-3 align-middle font-medium text-[var(--vc-purple-dark)]">{b.name}</td>

                      <td className="px-4 py-3 align-middle">
                        <code className="text-sm text-gray-700">{b.ip}</code>
                      </td>

                      <td className="px-4 py-3 align-middle" title={`${b.traficMb} Mo`}>
                        {formatTraffic(b.traficMb)}
                      </td>

                      <td className="px-4 py-3 align-middle">{b.connexions}</td>

                      <td className="px-4 py-3 align-middle">
                        <EtatBadge etat={b.status} />
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <span className="text-sm font-semibold">
                          {b.acces === "autorisé" ? "Autorisé" : b.acces === "limité" ? "Limité" : "Bloqué"}
                        </span>
                      </td>

                      <td className="px-4 py-3 align-middle">{b.frequenceRedemarrage}</td>

                      <td className="px-4 py-3 align-middle">
                        <span className={b.temperature > 55 ? "text-red-600 font-medium" : "text-gray-700"}>{b.temperature}</span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(b.id);
                            setPendingEditId(b.id);
                            setShowEditConfirm(true);
                          }}
                          className="px-2 py-1 text-xs bg-[var(--vc-purple)] text-white rounded font-semibold hover:bg-[var(--vc-purple-dark)] transition-all duration-150 active:scale-95"
                        >
                          Modifier
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {paginated.length === 0 && (
                  <tr>
                    <td colSpan="10" className="px-6 py-12 text-center text-gray-500 font-medium">
                      Aucun résultat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 mt-4 border-t">
            <div className="text-sm text-gray-600">
              Affichage {total === 0 ? 0 : start + 1}–{start + paginated.length} sur {total}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Page précédente"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-transform active:scale-95 ${
                  page === 1
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-200"
                    : "bg-gradient-to-r from-[#ff7a00] to-[#ff9933] text-white shadow-md hover:shadow-lg hover:scale-105"
                }`}
              >
                ← Préc
              </button>

              <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-semibold text-gray-700">
                {page} / {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label="Page suivante"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-transform active:scale-95 ${
                  page === totalPages
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-200"
                    : "bg-gradient-to-r from-[#ff7a00] to-[#ff9933] text-white shadow-md hover:shadow-lg hover:scale-105"
                }`}
              >
                Suiv →
              </button>
            </div>
          </div>

          {/* Légende des états centrée */}
          <div className="mt-6 flex flex-wrap gap-6 items-center justify-center">
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-500 rounded-full inline-block" /> <span className="text-sm">En service</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-orange-400 rounded-full inline-block" /> <span className="text-sm">Instable</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-red-600 rounded-full inline-block" /> <span className="text-sm">Hors ligne</span></div>
          </div>

          {/* Confirm dialog for reset */}
          {showResetConfirm && (
            <ConfirmDialog
              title="Confirmer la réinitialisation"
              message="Voulez‑vous vraiment réinitialiser toutes les bornes aux valeurs par défaut ?"
              onConfirm={confirmReset}
              onCancel={cancelReset}
              confirmLabel="Réinitialiser"
              cancelLabel="Annuler"
            />
          )}

          {/* Confirm dialog for edit confirmation */}
          {showEditConfirm && pendingEditId && (
            <ConfirmDialog
              title="Modifier la borne ?"
              message={`Voulez-vous éditer la borne « ${bornes.find((b) => b.id === pendingEditId)?.name} » ?`}
              onConfirm={handleConfirmEdit}
              onCancel={handleCancelEdit}
              confirmLabel="Oui, éditer"
              cancelLabel="Non, ne pas éditer"
            />
          )}

          {/* Confirm dialog pour changement d'état */}
          {showEtatConfirm && (
            <ConfirmDialog
              title="Confirmer le changement d'état"
              message={`Confirmer le passage de ${selectedForPanel.name || "la borne"} à « ${pendingEtat} » ?`}
              onConfirm={handleConfirmEtat}
              onCancel={handleCancelEtat}
              confirmLabel="Confirmer"
              cancelLabel="Annuler"
            />
          )}

          {/* Confirm dialog pour changement d'accès */}
          {showAccessConfirm && (
            <ConfirmDialog
              title="Confirmer le changement d'accès"
              message={`Confirmez-vous le changement d'accès de ${selectedForPanel.name || "la borne"} vers « ${pendingAccess} » ?`}
              onConfirm={handleConfirmAccess}
              onCancel={handleCancelAccess}
              confirmLabel="Confirmer"
              cancelLabel="Annuler"
            />
          )}

          {/* Slide panel : affichée uniquement si showPanelId est défini */}
          <SlidePanel
            selected={selectedForPanel}
            visible={!!showPanelId}
            onClose={() => setShowPanelId(null)}
            requestAccessChange={requestAccessChange}
            requestEtatChange={requestEtatChange}
            onValidate={handleValidate}
            onReset={() => setShowResetConfirm(true)}
            isValidating={isValidating}
          />

          <div className="mt-8 flex justify-center">
            <div className="text-sm text-gray-500 italic text-center max-w-xl">
              Sélectionnez une borne et cliquez sur « Oui, éditer » pour afficher la barre de configuration.
            </div>
          </div>

          {/* CSS pour animations */}
          <style>{`
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(12px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .animate-fadeInUp {
              animation: fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
              opacity: 0;
            }

            @keyframes notifSlide {
              from { opacity: 0; transform: translateY(-12px) scale(0.98); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
            .animate-notifSlide { animation: notifSlide 320ms cubic-bezier(.2,.8,.2,1) both; }

            @keyframes selectPulse {
              0% { box-shadow: 0 0 0 0 rgba(255,122,0,0.25); transform: translateY(0); background-color: rgba(255,250,240,0); }
              40% { box-shadow: 0 8px 24px -8px rgba(255,122,0,0.25); transform: translateY(-3px); background-color: rgba(255,250,240,0.6); }
              100% { box-shadow: none; transform: translateY(0); background-color: transparent; }
            }
            .select-flash { animation: selectPulse 700ms ease-out both; }

            @keyframes resetSplash {
              0% { background-color: rgba(255,250,240,0); transform: none; }
              30% { background-color: rgba(255,250,240,0.6); transform: translateY(-3px); }
              100% { background-color: transparent; transform: none; }
            }
            .reset-flash { animation: resetSplash 700ms ease-out both; }

            @keyframes scaleUp {
              from { opacity: 0; transform: scale(0.9); }
              to { opacity: 1; transform: scale(1); }
            }
            .animate-scaleUp { animation: scaleUp 220ms ease-out both; }
          `}</style>
        </section>
      </main>
    </Navbar>
  );
}
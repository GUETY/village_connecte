import React, { useState, useEffect } from "react";
import { alertesAPI, bornesAPI } from "../../services/api";
import Navbar1 from "../../components/navbar1.jsx";

export default function GestionDesAlertes() {
  const [identifiant, setIdentifiant] = useState("");
  const [date, setDate] = useState("");
  const [codeType, setCodeType] = useState("100");
  const [predefined, setPredefined] = useState("");
  const [selectedPredefinedCode, setSelectedPredefinedCode] = useState(null);
  const [autres, setAutres] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rows, setRows] = useState([]);
  const [notif, setNotif] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState({ creating: false, deleting: null });
  const [bornes, setBornes] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  // confirmation modal state (remplace window.confirm to avoid native 'localhost' dialog)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // mapping codeType -> predefined alerts
  // mapping codeType -> predefined alerts with specific codes
  const predefinedMap = {
    "100": [
      { label: "borne autorisée mais inaccessible", code: 101 },
      { label: "borne hors service", code: 102 },
      { label: "interférence détectée", code: 103 },
    ],
    "200": [
      { label: "tentative connexion non autorisée", code: 201 },
      { label: "nombre de connexions élevé", code: 202 },
      { label: "compte bloqué", code: 203 },
    ],
    "300": [
      { label: "panne matérielle détectée", code: 301 },
      { label: "capteur défectueux", code: 302 },
      { label: "redémarrage requis", code: 303 },
    ],
    "400": [
      { label: "erreur application critique", code: 401 },
      { label: "vulnérabilité détectée", code: 402 },
      { label: "mise à jour requise", code: 403 },
    ],
  };

  function handleValider() {
    if (!identifiant) {
      setNotif({ type: 'error', message: "Veuillez choisir un identifiant d'abord." });
      setTimeout(() => setNotif({ type: '', message: '' }), 3000);
      return;
    }

    (async () => {
      try {
        setLoading((s) => ({ ...s, creating: true }));
        const payload = {
          // use the specific predefined code when available (e.g. 101/102/201...)
          code: selectedPredefinedCode || Number(codeType) || 0,
          type: predefined,
          message: autres.trim() || predefined,
          emitter: identifiant || `borne${rows.length + 1}`,
          status: "NOUVELLE",
          metadata: { dateConstat: date || null },
        };
        const res = await alertesAPI.create(payload);
        const created = res?.data;
        if (created) setRows((r) => [created, ...r]);
        else
          setRows((r) => [
            ...r,
            {
              _id: `temp-${r.length + 1}`,
              createdAt: payload.metadata.dateConstat || new Date().toISOString(),
              type: payload.type,
              code: payload.code,
              emitter: payload.emitter,
              message: payload.message,
            },
          ]);
        setAutres("");
      } catch (err) {
        console.error("create alerte error:", err);
        setNotif({ type: "error", message: "Erreur lors de la création de l'alerte." });
      } finally {
        setLoading((s) => ({ ...s, creating: false }));
      }
    })();
  }

  // when codeType changes, ensure predefined list is updated and select value/code set
  useEffect(() => {
    const list = predefinedMap[codeType] || [];
    if (list.length > 0) {
      // set to first option by default
      setPredefined(list[0].label);
      setSelectedPredefinedCode(list[0].code);
    } else {
      setPredefined("");
      setSelectedPredefinedCode(null);
    }
  }, [codeType]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer les alertes
        const alertesData = await alertesAPI.list();
        if (Array.isArray(alertesData)) {
          setRows(alertesData);
        } else if (alertesData?.value && Array.isArray(alertesData.value)) {
          setRows(alertesData.value);
        }
      } catch (err) {
        console.error("fetch alertes error:", err);
        setNotif({ type: "error", message: "Erreur lors du chargement des alertes" });
      }

      try {
        // Récupérer les bornes
        const bornesData = await bornesAPI.list();
        if (Array.isArray(bornesData)) {
          const bornesList = bornesData.map((b) => b.name || b.identifiant || b.id);
          setBornes(bornesList);
        } else if (bornesData?.value && Array.isArray(bornesData.value)) {
          const bornesList = bornesData.value.map((b) => b.name || b.identifiant || b.id);
          setBornes(bornesList);
        }
      } catch (err) {
        console.error("fetch bornes error:", err);
        setNotif({ type: "error", message: "Erreur lors du chargement des bornes" });
      }
    };

    fetchData();
  }, []);

  return (
    <Navbar1 onSidebarToggle={(isOpen) => setSidebarOpen(isOpen)}>
      {/* Main wrapper: header est fixe — on ajoute un padding-top depuis la variable CSS fournie par Navbar1 */}
      <div
        className="min-h-screen px-4 sm:px-6 lg:px-10 pb-10 bg-gray-50 transition-all duration-300 overflow-x-hidden"
        style={{ paddingTop: "var(--vc-header-height, 64px)" }}
      >
        {/* Top right : Identifiant / Date */}
        <div className="flex flex-col sm:flex-row justify-end items-start sm:items-end gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <label className="text-sm font-semibold whitespace-nowrap">Identifiant</label>
            <div className="relative w-full sm:w-48">
              <input
                value={identifiant}
                onChange={(e) => {
                  setIdentifiant(e.target.value);
                  setShowDropdown(true);
                  setHighlightIndex(-1);
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => {
                  setTimeout(() => setShowDropdown(false), 150);
                }}
                onKeyDown={(e) => {
                  const filtered = bornes.filter((b) => b.toLowerCase().includes((identifiant || '').toLowerCase()));
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlightIndex((i) => Math.max(i - 1, 0));
                  } else if (e.key === 'Enter') {
                    if (highlightIndex >= 0 && filtered[highlightIndex]) {
                      setIdentifiant(filtered[highlightIndex]);
                      setShowDropdown(false);
                    }
                  } else if (e.key === 'Escape') {
                    setShowDropdown(false);
                  }
                }}
                placeholder="Rechercher une borne..."
                className="rounded-full border-2 border-orange-500 px-4 py-2 w-full"
                aria-label="Rechercher une borne"
              />

              {showDropdown && (
                <div className="absolute z-20 mt-1 w-full bg-white border rounded shadow max-h-40 overflow-auto">
                  {bornes.filter((b) => b.toLowerCase().includes((identifiant || '').toLowerCase())).length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">Aucune borne</div>
                  ) : (
                    bornes
                      .filter((b) => b.toLowerCase().includes((identifiant || '').toLowerCase()))
                      .map((b, idx) => (
                        <div
                          key={b}
                          onMouseDown={() => {
                            setIdentifiant(b);
                            setShowDropdown(false);
                          }}
                          onMouseEnter={() => setHighlightIndex(idx)}
                          className={`px-3 py-2 cursor-pointer text-sm ${highlightIndex === idx ? 'bg-orange-100' : ''}`}
                        >
                          {b}
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <label className="text-sm font-semibold whitespace-nowrap">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-full border-2 border-orange-500 px-4 py-2 w-full sm:w-48"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-4 md:gap-6 lg:gap-8">
          <div className="col-span-1 md:col-span-3 lg:col-span-3">
            <div className="mb-2 text-sm font-semibold">Code type & Type Alerte</div>

            <div className="border-2 border-orange-500 rounded-lg p-4 md:p-6">
              <div className="space-y-3 text-sm">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="ctype"
                    checked={codeType === "100"}
                    onChange={() => setCodeType("100")}
                    className="peer hidden"
                  />
                  <div className="w-4 h-4 rounded-full border-2 border-orange-500 flex items-center justify-center peer-checked:border-orange-600 peer-checked:bg-orange-500">
                    <div className="w-2 h-2 rounded-full bg-transparent peer-checked:bg-white"></div>
                  </div>
                  <span className="font-medium">100</span>
                  <span className="ml-2">Borne Wi-fi</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="ctype"
                    checked={codeType === "200"}
                    onChange={() => setCodeType("200")}
                    className="peer hidden"
                  />
                  <div className="w-4 h-4 rounded-full border-2 border-orange-500 flex items-center justify-center peer-checked:border-orange-600 peer-checked:bg-orange-500">
                    <div className="w-2 h-2 rounded-full bg-transparent peer-checked:bg-white"></div>
                  </div>
                  <span className="font-medium">200</span>
                  <span className="ml-2">Utilisateur</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="ctype"
                    checked={codeType === "300"}
                    onChange={() => setCodeType("300")}
                    className="peer hidden"
                  />
                  <div className="w-4 h-4 rounded-full border-2 border-orange-500 flex items-center justify-center peer-checked:border-orange-600 peer-checked:bg-orange-500">
                    <div className="w-2 h-2 rounded-full bg-transparent peer-checked:bg-white"></div>
                  </div>
                  <span className="font-medium">300</span>
                  <span className="ml-2">Matériel</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="ctype"
                    checked={codeType === "400"}
                    onChange={() => setCodeType("400")}
                    className="peer hidden"
                  />
                  <div className="w-4 h-4 rounded-full border-2 border-orange-500 flex items-center justify-center peer-checked:border-orange-600 peer-checked:bg-orange-500">
                    <div className="w-2 h-2 rounded-full bg-transparent peer-checked:bg-white"></div>
                  </div>
                  <span className="font-medium">400</span>
                  <span className="ml-2">Application</span>
                </label>
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-3 lg:col-span-6">
            <div className="mb-4">
              <div className="flex flex-col sm:flex-row justify-between mb-2 gap-2">
                <label className="text-sm font-semibold">Code type</label>
                <label className="text-sm font-semibold">Types d'alertes prédéfinies</label>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-1">
                <select
                  value={codeType}
                  onChange={(e) => setCodeType(e.target.value)}
                  className="border-2 border-orange-500 rounded px-3 py-2 w-full sm:w-28"
                >
                  <option value="100">100</option>
                  <option value="200">200</option>
                  <option value="300">300</option>
                  <option value="400">400</option>
                </select>

                <select
                  value={predefined}
                  onChange={(e) => {
                    const label = e.target.value;
                    setPredefined(label);
                    const list = predefinedMap[codeType] || [];
                    const found = list.find((o) => o.label === label);
                    setSelectedPredefinedCode(found ? found.code : null);
                  }}
                  className="border-2 border-orange-500 rounded px-3 py-2 flex-1 w-full sm:ml-2"
                >
                  {(predefinedMap[codeType] || []).map((o) => (
                    <option key={o.code} value={o.label}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Autres</label>
              <textarea
                value={autres}
                onChange={(e) => setAutres(e.target.value)}
                className="w-full border-2 border-orange-500 rounded px-3 py-2 h-24 resize-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleValider}
                disabled={!identifiant || loading.creating}
                className={`bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2 rounded shadow transition ${!identifiant || loading.creating ? 'opacity-50 cursor-not-allowed hover:bg-orange-500' : ''}`}
              >
                {loading.creating ? '...' : 'Valider'}
              </button>
            </div>
          </div>

          <div className="hidden lg:block col-span-3" />
        </div>

        <div className="mt-8 border-2 border-orange-500 rounded-lg overflow-hidden">
          <div className="bg-orange-500 text-white text-sm font-semibold grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 px-3 sm:px-4 py-3 gap-2">
            <div>Date émission</div>
            <div className="hidden sm:block">Code type</div>
            <div>Code</div>
            <div className="hidden lg:block">Nom identifiant</div>
            <div className="hidden lg:block">Alertes</div>
            <div className="text-right">Actions</div>
          </div>

          <div className="bg-white max-h-64 overflow-auto">
            {rows.length === 0 ? (
              <div className="p-6 text-center text-gray-500">Aucune alerte</div>
            ) : (
              rows.map((r) => (
                <div key={r._id || r.id} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 px-3 sm:px-4 py-3 border-b last:border-none text-sm items-center gap-2">
                  <div className="truncate">{r.dateEmission || (r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-CA') : '')}</div>
                  <div className="hidden sm:block">{r.type || r.codeType}</div>
                  <div>{r.code}</div>
                  <div className="hidden lg:block whitespace-normal break-words">{r.emitter || r.identifiant}</div>
                  <div className="hidden lg:block whitespace-normal break-words">{(r.code || r.codeType) ? `${r.code || r.codeType} — ${r.message || r.alertes}` : (r.message || r.alertes)}</div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        // open custom confirm modal
                        setConfirmTarget({ id: r._id || r.id, label: r.message || r.code || r._id });
                        setConfirmOpen(true);
                      }}
                      className="px-2 py-1 bg-red-600 text-white rounded text-xs whitespace-nowrap"
                    >
                      {loading.deleting === (r._id || r.id) ? '...' : 'Supprimer'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        {/* Toast animé */}
        {notif.message && (
          <div className="fixed inset-0 pointer-events-none z-50 flex items-start justify-end p-6">
            <div className={`pointer-events-auto transform transition-all duration-300 ${notif.message ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
              <div className={`${notif.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white px-4 py-2 rounded shadow-lg text-sm`}>{notif.message}</div>
            </div>
          </div>
        )}

        {/* Confirmation Modal (custom) */}
        {confirmOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-md p-4 transform transition-transform duration-200">
              <div className="text-lg font-semibold mb-2">Confirmer la suppression</div>
              <div className="text-sm text-gray-700 mb-4">Voulez-vous vraiment supprimer cette alerte&nbsp;: <strong>{confirmTarget?.label}</strong> ?</div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setConfirmOpen(false)} className="px-3 py-1 rounded bg-gray-200">Annuler</button>
                <button
                  onClick={async () => {
                    if (!confirmTarget) return;
                    setConfirmLoading(true);
                    try {
                      setLoading((s) => ({ ...s, deleting: confirmTarget.id }));
                      await alertesAPI.remove(confirmTarget.id);
                      setRows((prev) => prev.filter((x) => (x._id || x.id) !== confirmTarget.id));
                      setNotif({ type: 'success', message: 'Alerte supprimée.' });
                    } catch (err) {
                      console.error('delete alerte error:', err);
                      setNotif({ type: 'error', message: 'Erreur lors de la suppression.' });
                    } finally {
                      setLoading((s) => ({ ...s, deleting: null }));
                      setConfirmLoading(false);
                      setConfirmOpen(false);
                    }
                  }}
                  className="px-3 py-1 rounded bg-red-600 text-white"
                >
                  {confirmLoading ? '...' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Navbar1>
  );
}

import React, { useState, useEffect } from "react";
import { agentsAPI, groupsAPI } from "../../services/api";
import Navbar from "../../components/navbar1.jsx";

export default function GestionDesAccesUtilisateurs() {
  const [loginSelection, setLoginSelection] = useState("");
  const [groupSelection, setGroupSelection] = useState("");
  const [loginRadio, setLoginRadio] = useState("");
  const [selectAll, setSelectAll] = useState(false);

  // === Période globale ===
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
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

  // horaires / durée / priorité
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [durationValue, setDurationValue] = useState("");
  const [priorityValue, setPriorityValue] = useState("");

  // QUOTAS
  const [quotaValue, setQuotaValue] = useState("");
  const [speedValue, setSpeedValue] = useState("");

  // TABLEAU
  const [rows, setRows] = useState(
    Array.from({ length: 10 }).map((_, i) => ({
      id: i + 1,
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
      duration: "",
      periodic: false,
      quota: "",
      speed: "",
      priority: "",
      selected: false,
    }))
  );

  // === Sélection globale ===
  const toggleSelectAll = () => {
    const newState = !selectAll;
    setSelectAll(newState);
    setRows((prev) => prev.map((r) => ({ ...r, selected: newState })));
  };

  const toggleRow = (index, value) => {
    const updated = [...rows];
    updated[index].selected = value;

    if (!value) setSelectAll(false);
    else if (updated.every((r) => r.selected)) setSelectAll(true);

    setRows(updated);
  };

  // === Load users + groups ===
  const [availableLogins, setAvailableLogins] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [uRes, gRes] = await Promise.allSettled([
          agentsAPI.list(),
          groupsAPI.list()
        ]);
        
        if (uRes.status === "fulfilled") {
          const users = Array.isArray(uRes.value) ? uRes.value : uRes.value?.data || [];
          setAvailableLogins(users.map((u) => u.login || u.name));
        }
        
        if (gRes.status === "fulfilled") {
          const groups = Array.isArray(gRes.value) ? gRes.value : gRes.value?.data || [];
          setAvailableGroups(groups || []);
        }
      } catch (err) {
        console.error("load users/groups:", err);
      }
    })();
  }, []);

  // Charger les règles depuis la base quand on change le login/group sélectionné
  useEffect(() => {
    const ownerType = loginRadio === "login" ? "user" : loginRadio === "group" ? "group" : null;
    const owner = ownerType === "user" ? loginSelection : ownerType === "group" ? groupSelection : null;

    if (!ownerType || !owner) return; // rien à charger

    (async () => {
      try {
        // TODO: Ajouter l'API pour récupérer les règles d'accès si disponible
        // const res = await accessRulesAPI.list();
        // Pour l'instant, nous utilisons une structure locale
      } catch (err) {
        console.error("load access rules error:", err);
      }
    })();
  }, [loginRadio, loginSelection, groupSelection]);

  // === Format date lisible ===
  const formatDate = (d) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return d;
    }
  };

  // === Vidage des champs après Valider ===
  const resetLeftFields = () => {
    setPeriodStart("");
    setPeriodEnd("");
    setTimeStart("");
    setTimeEnd("");
    setDurationValue("");
    setPriorityValue("");
    setQuotaValue("");
    setSpeedValue("");
  };

  // === Application paramètres UNIQUEMENT quand on clique sur "Valider" ===
  const applySettings = async () => {
    // compute new rows first so we can send them to the server
    const anySelected = rows.some((r) => r.selected);
    const newRows = rows.map((row) => {
      // If no row is selected, apply to all rows; otherwise only to selected rows
      const shouldApply = anySelected ? row.selected : true;
      if (!shouldApply) return row;
      return {
        ...row,
        startDate: periodStart || row.startDate,
        endDate: periodEnd || row.endDate,
        startTime: timeStart || row.startTime,
        endTime: timeEnd || row.endTime,
        duration: durationValue || row.duration,
        quota: quotaValue !== "" ? quotaValue : row.quota,
        speed: speedValue !== "" ? speedValue : row.speed,
        priority: priorityValue || row.priority,
        periodic: !!(periodStart && periodEnd),
        selected: true,
      };
    });

    setRows(newRows);

    // Prepare payload: owner is either selected login or selected group
    const ownerType = loginRadio === "login" ? "user" : loginRadio === "group" ? "group" : null;
    const owner = ownerType === "user" ? loginSelection : ownerType === "group" ? groupSelection : null;

    // Only send if an owner is selected
    if (ownerType && owner) {
      const payload = {
        ownerType,
        owner,
        rows: newRows.filter((r) => r.startDate || r.endDate || r.startTime || r.endTime || r.duration || r.quota || r.speed || r.priority),
      };

      console.debug("Saving access rules payload:", payload);

      try {
        // TODO: Implémenter l'API pour sauvegarder les règles d'accès
        // const res = await accessRulesAPI.save(payload);
        // show animated toast instead of alert
        showToast("Enregistré");
      } catch (err) {
        console.error("save access rules error:", err);
        showToast("Erreur lors de l'enregistrement des règles", true);
      }
    } else {
      showToast("Aucun login ou groupe sélectionné — appliqué localement", true);
    }

    resetLeftFields();
  };

  return (
    <Navbar>
      <div className="min-h-screen pt-28 pl-8 pr-4 bg-white w-full max-w-[3000px] mx-auto">
        {/* Toast animé */}
        <div aria-live="polite" className="pointer-events-none fixed inset-0 flex items-start justify-end p-6 z-50">
          <div className="w-full flex flex-col items-end">
            <div className={`transform transition-all duration-300 pointer-events-auto ${toastVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
              <div className={`${toastError ? 'bg-red-600' : 'bg-green-600'} text-white px-4 py-2 rounded shadow-lg text-sm`}>{toastMessage}</div>
            </div>
          </div>
        </div>
        {/* SÉLECTEURS */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-10">
            <div className="flex items-start gap-10">
              {/* Login */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="relative flex h-4 w-4">
                    <input
                      type="radio"
                      name="accessType"
                      value="login"
                      checked={loginRadio === "login"}
                      onChange={() => setLoginRadio("login")}
                      className="peer appearance-none h-4 w-4 rounded-full border-2 border-orange-500 cursor-pointer"
                    />
                    <span className="pointer-events-none absolute inset-0 hidden peer-checked:flex items-center justify-center">
                      <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                    </span>
                  </span>
                  <span className="text-sm font-semibold">Login Utilisateur</span>
                </label>

                <select
                  value={loginSelection}
                  onChange={(e) => setLoginSelection(e.target.value)}
                  disabled={loginRadio !== "login"}
                  className="rounded-full border-2 border-orange-500 px-3 py-1.5 w-56 text-sm disabled:opacity-50"
                >
                  <option value="">-- choisir --</option>
                  {availableLogins.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              {/* Groupe */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="relative flex h-4 w-4">
                    <input
                      type="radio"
                      name="accessType"
                      value="group"
                      checked={loginRadio === "group"}
                      onChange={() => setLoginRadio("group")}
                      className="peer appearance-none h-4 w-4 rounded-full border-2 border-orange-500 cursor-pointer"
                    />
                    <span className="pointer-events-none absolute inset-0 hidden peer-checked:flex items-center justify-center">
                      <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                    </span>
                  </span>
                  <span className="text-sm font-semibold">Groupe utilisateur</span>
                </label>

                <select
                  value={groupSelection}
                  onChange={(e) => setGroupSelection(e.target.value)}
                  disabled={loginRadio !== "group"}
                  className="rounded-full border-2 border-orange-500 px-3 py-1.5 w-56 text-sm disabled:opacity-50"
                >
                  <option value="">-- choisir --</option>
                  {availableGroups.map((g) => (
                    <option key={g._id || g.id || g.name} value={g._id || g.id || g.name}>
                      {g.name || g}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* GRILLE */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* === COLONNE GAUCHE === */}
          <div className="col-span-4">
            <div className="border-2 border-orange-500 rounded-lg p-3 text-sm w-[280px] space-y-3">

              <label className="flex items-center gap-2 cursor-pointer">
                <span className="relative flex h-4 w-4">
                  <input type="radio" name="freq" className="peer appearance-none h-4 w-4 rounded-full border-2 border-orange-500 cursor-pointer"/>
                  <span className="pointer-events-none absolute inset-0 hidden peer-checked:flex items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                  </span>
                </span>
                Chaque jour
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <span className="relative flex h-4 w-4">
                  <input type="radio" name="freq" className="peer appearance-none h-4 w-4 rounded-full border-2 border-orange-500 cursor-pointer"/>
                  <span className="pointer-events-none absolute inset-0 hidden peer-checked:flex items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                  </span>
                </span>
                Chaque semaine
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <span className="relative flex h-4 w-4">
                  <input type="radio" name="freq" className="peer appearance-none h-4 w-4 rounded-full border-2 border-orange-500 cursor-pointer"/>
                  <span className="pointer-events-none absolute inset-0 hidden peer-checked:flex items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                  </span>
                </span>
                Chaque mois
              </label>

              {/* PÉRIODE */}
              <div className="flex items-start gap-2">
                <span className="relative flex h-4 w-4 mt-1">
                  <input type="radio" name="freq" className="peer appearance-none h-4 w-4 rounded-full border-2 border-orange-500 cursor-pointer"/>
                  <span className="pointer-events-none absolute inset-0 hidden peer-checked:flex items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                  </span>
                </span>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span>Période du</span>
                    <input
                      type="date"
                      value={periodStart}
                      onChange={(e) => setPeriodStart(e.target.value)}
                      className="border border-orange-400 rounded px-2 py-1 w-[120px]"
                    />
                  </div>

                  <div className="flex items-center gap-2 ml-[65px]">
                    <span>au</span>
                    <input
                      type="date"
                      value={periodEnd}
                      onChange={(e) => setPeriodEnd(e.target.value)}
                      className="border border-orange-400 rounded px-2 py-1 w-[120px]"
                    />
                  </div>
                </div>
              </div>

              {/* HORAIRE */}
              <div className="flex items-start gap-2">
                <span className="relative flex h-4 w-4 mt-1">
                  <input type="radio" name="freq" className="peer appearance-none h-4 w-4 rounded-full border-2 border-orange-500 cursor-pointer"/>
                  <span className="pointer-events-none absolute inset-0 hidden peer-checked:flex items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                  </span>
                </span>

                <div className="flex flex-col">
                  <span>Définir horaire (24h) de</span>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="time"
                      value={timeStart}
                      onChange={(e) => setTimeStart(e.target.value)}
                      className="border border-orange-400 rounded px-2 py-1 w-[90px]"
                    />
                    <span>à</span>
                    <input
                      type="time"
                      value={timeEnd}
                      onChange={(e) => setTimeEnd(e.target.value)}
                      className="border border-orange-400 rounded px-2 py-1 w-[90px]"
                    />
                  </div>
                </div>
              </div>

              {/* DURÉE */}
              <div className="flex items-center gap-2">
                <span className="relative flex h-4 w-4">
                  <input type="radio" name="freq" className="peer appearance-none h-4 w-4 rounded-full border-2 border-orange-500 cursor-pointer"/>
                  <span className="pointer-events-none absolute inset-0 hidden peer-checked:flex items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                  </span>
                </span>

                <span>Durée (min)</span>
                <input
                  type="number"
                  value={durationValue}
                  onChange={(e) => setDurationValue(e.target.value)}
                  className="border border-orange-400 rounded px-2 py-1 w-[70px]"
                />
              </div>

              {/* PRIORITÉ */}
              <div className="flex items-center gap-5 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="relative flex h-4 w-4">
                    <input
                      type="radio"
                      name="prio"
                      value="prio"
                      checked={priorityValue === "prio"}
                      onChange={() => setPriorityValue("prio")}
                      className="peer appearance-none h-4 w-4 rounded-full border-2 border-orange-500 cursor-pointer"
                    />
                    <span className="pointer-events-none absolute inset-0 hidden peer-checked:flex items-center justify-center">
                      <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                    </span>
                  </span>
                  Priorité
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="relative flex h-4 w-4">
                    <input
                      type="radio"
                      name="prio"
                      value="normal"
                      checked={priorityValue === "normal"}
                      onChange={() => setPriorityValue("normal")}
                      className="peer appearance-none h-4 w-4 rounded-full border-2 border-orange-500 cursor-pointer"
                    />
                    <span className="pointer-events-none absolute inset-0 hidden peer-checked:flex items-center justify-center">
                      <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                    </span>
                  </span>
                  Normal
                </label>
              </div>
            </div>
          </div>

          {/* === COLONNE DROITE === */}
          <div className="col-span-8 scale-[0.95]">

            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex-1 text-center">
                LISTE RÉCAPITULATIVE DES TEMPS ET DURÉES D'ACCÈS
              </h3>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                  className="appearance-none w-4 h-4 border-2 border-orange-500 rounded-sm checked:bg-orange-500 checked:border-orange-500 cursor-pointer"
                />
                Tout sélectionner
              </label>
            </div>

            {/* TABLEAU */}
            <div className="border-2 border-orange-500 rounded-md overflow-hidden mb-5">
              <div className="bg-orange-500 text-white text-xs font-semibold grid grid-cols-9 px-2 py-2 text-center">
                <div>Sélection</div>
                <div>Date début</div>
                <div>Date fin</div>
                <div>Heure début</div>
                <div>Heure fin</div>
                <div>Durée</div>
                <div>Périodique</div>
                <div>Quota (Mo)</div>
                <div>Vitesse (kbit/s)</div>
              </div>

              <div className="bg-white">
                {rows.map((r, index) => (
                  <div
                    key={r.id}
                    className="grid grid-cols-9 items-center px-2 py-1.5 border-b border-orange-300 text-xs"
                  >
                    {/* Sélection */}
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={r.selected}
                        onChange={(e) => toggleRow(index, e.target.checked)}
                        className="appearance-none w-4 h-4 border-2 border-orange-500 rounded-sm checked:bg-orange-500 checked:border-orange-500 cursor-pointer"
                      />
                    </div>

                    {/* Champs tableau */}
                    <input
                      className={`text-center outline-none px-1 ${r.startDate ? "bg-gray-100" : "bg-white"}`}
                      value={r.startDate || ""}
                      placeholder={r.startDate}
                      disabled={!!r.startDate}
                      onChange={(e) => {
                        const updated = [...rows];
                        updated[index].startDate = e.target.value;
                        setRows(updated);
                      }}
                    />

                    <input
                      className={`text-center outline-none px-1 ${r.endDate ? "bg-gray-100" : "bg-white"}`}
                      value={r.endDate || ""}
                      placeholder={r.endDate}
                      disabled={!!r.endDate}
                      onChange={(e) => {
                        const updated = [...rows];
                        updated[index].endDate = e.target.value;
                        setRows(updated);
                      }}
                    />

                    <input
                      type="time"
                      className={`text-center outline-none px-1 ${r.startTime ? "bg-gray-100" : "bg-white"}`}
                      value={r.startTime || ""}
                      disabled={!!r.startTime}
                      onChange={(e) => {
                        const updated = [...rows];
                        updated[index].startTime = e.target.value;
                        setRows(updated);
                      }}
                    />

                    <input
                      type="time"
                      className={`text-center outline-none px-1 ${r.endTime ? "bg-gray-100" : "bg-white"}`}
                      value={r.endTime || ""}
                      disabled={!!r.endTime}
                      onChange={(e) => {
                        const updated = [...rows];
                        updated[index].endTime = e.target.value;
                        setRows(updated);
                      }}
                    />

                    <input
                      className={`text-center outline-none px-1 ${r.duration ? "bg-gray-100" : "bg-white"}`}
                      value={r.duration || ""}
                      placeholder={r.duration}
                      disabled={!!r.duration}
                      onChange={(e) => {
                        const updated = [...rows];
                        updated[index].duration = e.target.value;
                        setRows(updated);
                      }}
                    />

                    {/* périodique */}
                    <div className="text-center text-[11px]">
                      {r.startDate && r.endDate
                        ? `${formatDate(r.startDate)} → ${formatDate(r.endDate)}`
                        : "Non défini"}
                    </div>

                    <input
                      className={`text-center outline-none px-1 ${r.quota ? "bg-gray-100" : "bg-white"}`}
                      value={r.quota || ""}
                      placeholder={r.quota}
                      disabled={!!r.quota}
                      onChange={(e) => {
                        const updated = [...rows];
                        updated[index].quota = e.target.value;
                        setRows(updated);
                      }}
                    />

                    <input
                      className={`text-center outline-none px-1 ${r.speed ? "bg-gray-100" : "bg-white"}`}
                      value={r.speed || ""}
                      placeholder={r.speed}
                      disabled={!!r.speed}
                      onChange={(e) => {
                        const updated = [...rows];
                        updated[index].speed = e.target.value;
                        setRows(updated);
                      }}
                    />

                  </div>
                ))}
              </div>
            </div>

            {/* QUOTAS */}
            <div className="border-2 border-orange-500 rounded-md p-4 flex items-center justify-between">

              <div className="grid grid-cols-2 gap-4 w-3/4">
                <div>
                  <label className="text-xs font-semibold">Quota (Mo)</label>
                  <input
                    className="w-full border-2 border-orange-500 rounded px-3 py-1 mt-1 text-sm"
                    value={quotaValue}
                    onChange={(e) => setQuotaValue(e.target.value)}
                  />
                  <p className="text-[10px] text-gray-500 mt-1">0 = quota illimité</p>
                </div>

                <div>
                  <label className="text-xs font-semibold">Vitesse (kbit/s)</label>
                  <input
                    className="w-full border-2 border-orange-500 rounded px-3 py-1 mt-1 text-sm"
                    value={speedValue}
                    onChange={(e) => setSpeedValue(e.target.value)}
                  />
                  <p className="text-[10px] text-gray-500 mt-1">0 = vitesse Maximum</p>
                </div>
              </div>

              {/* BTN VALIDER */}
              <button
                onClick={applySettings}
                className="bg-purple-700 text-white px-4 py-2 text-sm rounded shadow hover:bg-purple-800"
              >
                Valider
              </button>
              {/* Inline fallback visible near the button when toast fails */}
              {toastVisible && (
                <div className={`ml-3 text-sm ${toastError ? 'text-red-600' : 'text-green-600'}`}>
                  {toastMessage}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </Navbar>
  );
}

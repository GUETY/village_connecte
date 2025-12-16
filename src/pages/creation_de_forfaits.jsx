import React, { useState, useEffect } from "react";
import Navbar from "../components/navbar";
// --- ajout import API ---
import { forfaitAPI, setAuthToken } from "../services/api.js";

/**
 * Page : Création de forfaits
 * - Création de forfaits via formulaire
 * - Champs : catégorie forfait, nom, description, durée (min/heure/jours), montant
 * - Tableau récapitulatif des forfaits créés
 * - Design professionnel avec animations
 */

function SuccessNotification({ message, onClose, type = "success" }) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success" ? "bg-green-50 border-green-500" : type === "error" ? "bg-red-50 border-red-500" : "bg-blue-50 border-blue-500";
  const textColor = type === "success" ? "text-green-800" : type === "error" ? "text-red-800" : "text-blue-800";
  const iconColor = type === "success" ? "text-green-600" : type === "error" ? "text-red-600" : "text-blue-600";
  const closeColor = type === "success" ? "text-green-600 hover:text-green-800" : type === "error" ? "text-red-600 hover:text-red-800" : "text-blue-600 hover:text-blue-800";

  return (
    <div className="fixed top-6 right-6 z-50 animate-slideDown">
      <div className={`${bgColor} rounded-lg p-4 shadow-lg flex items-center gap-3 max-w-sm border-l-4`}>
        <div className="flex-shrink-0">
          {type === "success" && (
            <svg className={`w-6 h-6 ${iconColor} animate-bounce`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
          {type === "error" && (
            <svg className={`w-6 h-6 ${iconColor}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
          {type === "info" && (
            <svg className={`w-6 h-6 ${iconColor}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <p className={`text-sm font-semibold ${textColor}`}>{message}</p>
        </div>
        <button onClick={onClose} className={`${closeColor} transition-colors`}>
          ✕
        </button>
      </div>
    </div>
  );
}

function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = () => {
    setIsConfirming(true);
    setTimeout(() => {
      onConfirm();
      setIsConfirming(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
      <div className={`bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl ${isConfirming ? "animate-scaleDown" : "animate-scaleUp"}`}>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isConfirming}
            className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirming}
            className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 relative overflow-hidden"
          >
            <span className={`transition-all ${isConfirming ? "opacity-0" : "opacity-100"}`}>
              oui
            </span>
            {isConfirming && (
              <span className="absolute inset-0 flex items-center justify-center">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Deuxième étape : saisie du nom pour confirmer suppression
function NameConfirmDialog({ title, expectedName, onConfirmName, onCancel }) {
  const [input, setInput] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = () => {
    setError("");
    setIsChecking(true);
    setTimeout(() => {
      if (input.trim() === expectedName) {
        onConfirmName();
      } else {
        setError("Le nom saisi ne correspond pas. Veuillez réessayer.");
      }
      setIsChecking(false);
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl animate-scaleUp">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">Tapez exactement : <span className="font-semibold">{expectedName}</span> puis confirmez pour supprimer.</p>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full px-3 py-2 border rounded mb-2 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]"
          placeholder="Entrez le nom ici"
          aria-label="Confirmation nom"
        />
        {error && <div className="text-xs text-red-600 mb-2">{error}</div>}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isChecking}
            className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={isChecking}
            className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-all relative overflow-hidden"
          >
            {isChecking ? "Vérification..." : "Confirmer suppression"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ForfaitForm({ onAddForfait, categories, editingIndex, editingData, onCancelEdit }) {
  // adaptation des clés pour correspondre au schéma Mongoose :
  // category, name, description, durationValue, durationUnit, price
  const [formData, setFormData] = useState(
    editingData || {
      category: "",
      name: "",
      description: "",
      durationValue: "",
      durationUnit: "days",
      price: "",
    }
  );

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [notificationType, setNotificationType] = useState("success");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualMontant, setManualMontant] = useState(false);

  // mapping d'étiquette (UI) vers clés BDD
  const handleInputChange = (field, value) => {
    const map = {
      categorieForfait: "category",
      nom: "name",
      descriptionForfait: "description",
      duree: "durationValue",
      uniteDuree: "durationUnit",
      montant: "price",
    };
    const key = map[field] || field;
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // calcul automatique (garde logique existante, adapte aux nouvelles clés)
  useEffect(() => {
    if (manualMontant) return;
    const { category, durationValue, durationUnit } = formData;
    const d = Number(durationValue);
    if (!category || !d || d <= 0) {
      setFormData((s) => ({ ...s, price: "" }));
      return;
    }

    const baseRateByUnit = {
      minutes: 50,
      hours: 2500,
      days: 15000,
    };
    const categoryMultiplier = {
      "Hebdomadaire": 1.0,
      "Mensuel": 3.5,
      "Illimité": 6.0,
      "Spécial": 1.25,
    };

    const base = baseRateByUnit[durationUnit] ?? baseRateByUnit.days;
    const mult = categoryMultiplier[category] ?? 1;
    const calculated = Math.round(base * d * mult);
    setFormData((s) => ({ ...s, price: String(calculated) }));
  }, [formData.category, formData.durationValue, formData.durationUnit, manualMontant]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // validation selon clés BDD
    if (!formData.category || !formData.name || !formData.description || !formData.durationValue || formData.price === "") {
      setSuccessMessage("⚠️ Veuillez remplir tous les champs obligatoires");
      setNotificationType("error");
      setShowSuccess(true);
      return;
    }
    if (isNaN(formData.durationValue) || isNaN(Number(formData.price))) {
      setSuccessMessage("⚠️ Veuillez entrer des valeurs numériques");
      setNotificationType("error");
      setShowSuccess(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        category: formData.category || null,
        name: formData.name,
        description: formData.description || null,
        durationValue: Number(formData.durationValue),
        durationUnit: formData.durationUnit,
        price: Number(formData.price),
      };

      let result;
      if (editingIndex !== undefined && editingIndex !== null && editingData) {
        const id = editingData.id || editingData._id;
        if (id) {
          result = await forfaitAPI.update(id, payload);
          onAddForfait(result, editingIndex);
        }
      } else {
        result = await forfaitAPI.create(payload);
        onAddForfait(result);
      }

      setSuccessMessage(`✓ Forfait "${formData.name}" ${editingIndex !== undefined ? "modifié" : "créé"} avec succès !`);
      setNotificationType("success");
      setShowSuccess(true);
      // reset sans toucher style
      setFormData({
        category: "",
        name: "",
        description: "",
        durationValue: "",
        durationUnit: "days",
        price: "",
      });
      setManualMontant(false);
      onCancelEdit?.();
    } catch (err) {
      console.error("Erreur création/mise à jour forfait :", err);
      setSuccessMessage("Une erreur est survenue lors de l'enregistrement");
      setNotificationType("error");
      setShowSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      category: "",
      name: "",
      description: "",
      durationValue: "",
      durationUnit: "days",
      price: "",
    });
    if (onCancelEdit) onCancelEdit();
    setManualMontant(false);
  };

  // Remplacez l'ancien mapping par un mapping avec les valeurs attendues par le backend
  const uniteDureeLabels = {
    minutes: "min",
    hours: "heure",
    days: "jours",
  };

  return (
    <>
      {showSuccess && (
        <SuccessNotification 
          message={successMessage} 
          onClose={() => setShowSuccess(false)}
          type={notificationType}
        />
      )}

      <div className="bg-white rounded-lg p-4 md:p-6 mb-6 shadow-sm">
        <h2 className="text-base md:text-lg font-bold text-gray-900 mb-4">
          {editingIndex !== undefined ? "Modifier forfait" : "Créer forfait"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          {/* Grille des champs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 md:gap-3">
            {/* Catégorie forfait */}
            <div className="flex flex-col">
              <label htmlFor="forfait-category" className="text-xs md:text-sm font-semibold text-gray-700 mb-1">Catégorie *</label>
              <select
                id="forfait-category"
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                className="px-2 md:px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff7a00] bg-white cursor-pointer transition-all text-xs md:text-sm"
                style={{ backgroundColor: "white", borderBottom: "2px solid #ff7a00" }}
              >
                <option value="">Sélectionner</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.nom}>
                    {cat.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* Nom */}
            <div className="flex flex-col">
              <label htmlFor="forfait-name" className="text-xs md:text-sm font-semibold text-gray-700 mb-1">Nom *</label>
              <input
                id="forfait-name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="px-2 md:px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff7a00] transition-all text-xs md:text-sm"
                style={{ borderBottom: "2px solid #ff7a00" }}
                placeholder="maxi-réseau"
              />
            </div>

            {/* Description forfait */}
            <div className="flex flex-col">
              <label htmlFor="forfait-description" className="text-xs md:text-sm font-semibold text-gray-700 mb-1">Description *</label>
              <input
                id="forfait-description"
                type="text"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className="px-2 md:px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff7a00] transition-all text-xs md:text-sm"
                style={{ borderBottom: "2px solid #ff7a00" }}
                placeholder="Hebdomadaire"
              />
            </div>

            {/* Durée */}
            <div className="flex flex-col">
              <label htmlFor="forfait-duration" className="text-xs md:text-sm font-semibold text-gray-700 mb-1">Durée *</label>
              <input
                id="forfait-duration"
                type="number"
                value={formData.durationValue}
                onChange={(e) => handleInputChange("durationValue", e.target.value)}
                className="px-2 md:px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff7a00] transition-all text-xs md:text-sm"
                style={{ borderBottom: "2px solid #ff7a00" }}
                placeholder="7"
                min="1"
              />
            </div>

            {/* Montant */}
            <div className="flex flex-col">
              <label htmlFor="forfait-price" className="text-xs md:text-sm font-semibold text-gray-700 mb-1">Montant *</label>
              <div className="flex items-center gap-3">
                <input
                  id="forfait-price"
                  type="number"
                  value={formData.price === "" ? "" : Number(formData.price)}
                  onChange={(e) => {
                    setManualMontant(true);
                    handleInputChange("price", e.target.value);
                  }}
                  className="flex-1 px-2 md:px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff7a00] transition-all text-xs md:text-sm bg-white"
                  style={{ borderBottom: "2px solid #ff7a00" }}
                  placeholder="0"
                  min="0"
                  step="100"
                />
              </div>
            </div>
          </div>

          {/* Unité de durée (radio buttons) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 bg-gray-50 rounded-lg">
            <span className="text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">Unité :</span>
            <div className="flex gap-4 md:gap-6">
              {Object.entries(uniteDureeLabels).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="durationUnit"
                    value={value}
                    checked={formData.durationUnit === value}
                    onChange={(e) => handleInputChange("durationUnit", e.target.value)}
                    className="w-4 h-4 accent-[#ff7a00]"
                  />
                  <span className="text-xs md:text-sm font-medium text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Boutons d'action - alignés à droite */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 md:px-6 py-1.5 md:py-2 bg-gray-300 text-gray-700 font-bold text-sm md:text-base rounded-lg hover:bg-gray-400 transition-all hover:scale-105 active:scale-95 order-2 sm:order-1"
            >
              Réinitialiser
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 md:px-6 py-1.5 md:py-2 bg-[#ff7a00] text-white font-bold text-sm md:text-base rounded-lg hover:bg-[#ff9933] shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-70 relative overflow-hidden order-1 sm:order-2"
            >
              <span className={`transition-all ${isSubmitting ? "opacity-0" : "opacity-100"}`}>
                {editingIndex !== undefined ? "Modifier" : "Créer"}
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

function ForfaitTable({ forfaits, onEdit, onDelete, onFilter, filterText }) {
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [showNameConfirm, setShowNameConfirm] = useState(false);
  const [search, setSearch] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState("success");

  // Filtrer les forfaits — utilise maintenant les clés BDD (category, name, description)
  const filtered = React.useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    if (!q) return forfaits;
    return forfaits.filter((forfait) => {
      return (
        (forfait.category || "").toString().toLowerCase().includes(q) ||
        (forfait.name || "").toString().toLowerCase().includes(q) ||
        (forfait.description || "").toString().toLowerCase().includes(q)
      );
    });
  }, [forfaits, search]);

  const handleDeleteClick = (index) => {
    // étape 1 : confirmation simple
    setDeleteIndex(index);
  };

  // appelée après la première confirmation (oui) -> afficher la demande de saisie du nom
  const handleProceedToNameConfirm = () => {
    setShowNameConfirm(true);
  };

  // appelée quand l'utilisateur confirme en saisissant correctement le nom
  const handleConfirmByName = () => {
    const indexToDelete = deleteIndex;
    const forfaitName = forfaits[indexToDelete].nom;
    onDelete(indexToDelete);
    setDeleteIndex(null);
    setShowNameConfirm(false);
    setNotificationMessage(`✓ Forfait "${forfaitName}" supprimé avec succès !`);
    setNotificationType("success");
    setShowNotification(true);
  };

  const handleCancelDelete = () => {
    setNotificationMessage("❌ Suppression annulée");
    setNotificationType("info");
    setShowNotification(true);
    setDeleteIndex(null);
    setShowNameConfirm(false);
  };

  return (
    <>
      {showNotification && (
        <SuccessNotification 
          message={notificationMessage} 
          onClose={() => setShowNotification(false)}
          type={notificationType}
        />
      )}

      {/* étape 1 : confirmation basique */}
      {deleteIndex !== null && !showNameConfirm && (
        <ConfirmDialog
          title="Supprimer forfait"
          message={`Êtes-vous sûr de vouloir supprimer le forfait "${forfaits[deleteIndex]?.name || ''}" ?`}
          onConfirm={() => setShowNameConfirm(true)}
          onCancel={() => {
            setDeleteIndex(null);
            setShowNotification(true);
            setNotificationMessage("❌ Suppression annulée");
            setNotificationType("info");
          }}
        />
      )}

      {/* étape 2 : saisie du nom pour confirmer */}
      {showNameConfirm && deleteIndex !== null && (
        <NameConfirmDialog
          title="Confirmer la suppression"
          expectedName={forfaits[deleteIndex]?.name || ""}
          onConfirmName={() => {
            const idx = deleteIndex;
            onDelete(idx);
            setDeleteIndex(null);
            setShowNameConfirm(false);
            setNotificationMessage(`✓ Forfait "${forfaits[idx]?.name}" supprimé avec succès !`);
            setNotificationType("success");
            setShowNotification(true);
          }}
          onCancel={() => {
            setDeleteIndex(null);
            setShowNameConfirm(false);
          }}
        />
      )}

      <div className="bg-white rounded-lg overflow-hidden shadow-sm">
        {/* Contrôles */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 border-b border-gray-100">
          <div className="text-xs md:text-sm text-gray-600 whitespace-nowrap">
            {filtered.length} forfait(s)
          </div>
          <input
            type="search"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 rounded text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-green-300 w-full sm:w-48 transition-all"
            style={{ borderBottom: "2px solid #22c55e" }}
            aria-label="Recherche forfaits"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 text-xs md:text-sm" role="table" aria-label="Tableau des forfaits">
            <caption className="sr-only">Liste des forfaits créés avec détails</caption>
            <thead className="bg-[#ff7a00] text-white sticky top-0">
              <tr>
                <th className="px-2 md:px-4 py-2.5 text-left font-semibold whitespace-nowrap">Catégorie</th>
                <th className="px-2 md:px-4 py-2.5 text-left font-semibold whitespace-nowrap">Nom</th>
                <th className="px-2 md:px-4 py-2.5 text-left font-semibold whitespace-nowrap">Description</th>
                <th className="px-2 md:px-4 py-2.5 text-left font-semibold whitespace-nowrap">Durée</th>
                <th className="px-2 md:px-4 py-2.5 text-left font-semibold whitespace-nowrap">Montant</th>
                <th className="px-2 md:px-4 py-2.5 text-left font-semibold whitespace-nowrap">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filtered.length > 0 ? (
                filtered.map((forfait, idx) => (
                  <tr
                    key={forfait.id || forfait._id || idx}
                    className="hover:bg-orange-50/50 transition-colors duration-200 animate-fadeIn"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <td className="px-2 md:px-4 py-2.5 align-middle">
                      <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold whitespace-nowrap">
                        {forfait.category || "-"}
                      </span>
                    </td>
                    <td className="px-2 md:px-4 py-2.5 align-middle font-semibold text-gray-900 text-xs md:text-sm truncate">{forfait.name}</td>
                    <td className="px-2 md:px-4 py-2.5 align-middle text-gray-700 text-xs md:text-sm truncate">{forfait.description || "-"}</td>
                    <td className="px-2 md:px-4 py-2.5 align-middle">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium whitespace-nowrap">
                        {forfait.durationValue} {forfait.durationUnit === "minutes" ? "min" : forfait.durationUnit === "hours" ? "h" : "j"}
                      </span>
                    </td>
                    <td className="px-2 md:px-4 py-2.5 align-middle">
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold whitespace-nowrap">
                        {forfait.price != null ? parseFloat(forfait.price).toLocaleString("fr-FR") + " FCFA" : "-"}
                      </span>
                    </td>
                    <td className="px-2 md:px-4 py-2.5 align-middle">
                      <div className="flex gap-1 flex-wrap">
                        <button
                          onClick={() => onEdit(forfaits.indexOf(forfait))}
                          className="inline-flex items-center gap-0.5 px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                          title="Modifier"
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          onClick={() => handleDeleteClick(forfaits.indexOf(forfait))}
                          className="inline-flex items-center gap-0.5 px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-600 hover:bg-red-200 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                          title="Supprimer"
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-4 py-6 md:py-8 text-center text-gray-500 font-medium text-xs md:text-sm">
                    <svg className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {search ? "Aucun forfait trouvé" : "Aucun forfait pour le moment. Créez-en un ci-dessus."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default function CreationDeForfaits() {
  const categories = [
    { id: 1, nom: "Hebdomadaire" },
    { id: 2, nom: "Mensuel" },
    { id: 3, nom: "Illimité" },
    { id: 4, nom: "Spécial" },
  ];

  const [forfaits, setForfaits] = useState([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [editingIndex, setEditingIndex] = useState(undefined);
  const [editingData, setEditingData] = useState(null);

  // Charger depuis l'API au montage (utilise setAuthToken si token présent)
  useEffect(() => {
    const token = localStorage.getItem("village_token");
    if (token) setAuthToken(token);

    let mounted = true;
    forfaitAPI
      .list()
      .then((data) => {
        if (!mounted) return;
        const list = Array.isArray(data) ? data : data?.data || [];
        setForfaits(list);
      })
      .catch((err) => {
        console.error("Erreur chargement forfaits depuis API :", err);
        // fallback : laisser la liste vide
      });
    return () => (mounted = false);
  }, []);

  // handlers inchangés mais adaptés pour champs BDD dans ForfaitTable / ajout suppression
  const handleAddForfait = (createdForfait, editingIdx) => {
    if (editingIdx !== undefined && editingIdx !== null) {
      setForfaits((prev) => {
        const copy = [...prev];
        copy[editingIdx] = createdForfait;
        return copy;
      });
      setEditingIndex(undefined);
      setEditingData(null);
    } else {
      setForfaits((prev) => [...prev, createdForfait]);
    }
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 4000);
  };

  const handleEditForfait = (index) => {
    setEditingIndex(index);
    setEditingData(forfaits[index]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingIndex(undefined);
    setEditingData(null);
  };

  const handleDeleteForfait = (index) => {
    setForfaits(forfaits.filter((_, i) => i !== index));
  };

  return (
    <Navbar>
      <main className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 py-3 md:py-4 font-sans antialiased text-gray-800">
        <section>
          {/* Header */}
          <header className="mb-4 pb-3 border-b border-gray-200">
            <h1 className="text-lg md:text-2xl font-bold text-[var(--vc-purple)] mb-0.5">Création de forfaits</h1>
            <p className="text-xs md:text-sm text-gray-600">Gérez vos forfaits d'accès</p>
          </header>

          {/* Formulaire de création */}
          <ForfaitForm 
            onAddForfait={handleAddForfait} 
            categories={categories}
            editingIndex={editingIndex}
            editingData={editingData}
            onCancelEdit={handleCancelEdit}
          />

          {/* Tableau récapitulatif */}
          <div>
            <h2 className="text-sm md:text-base font-bold text-gray-900 mb-3">Liste des forfaits</h2>
            <ForfaitTable 
              forfaits={forfaits} 
              onEdit={handleEditForfait} 
              onDelete={handleDeleteForfait}
            />
          </div>
        </section>
      </main>

      {/* CSS pour animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleUp {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes scaleDown {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.9);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
        .animate-slideDown {
          animation: slideDown 0.4s ease-out;
        }
        .animate-scaleUp {
          animation: scaleUp 0.3s ease-out;
        }
        .animate-scaleDown {
          animation: scaleDown 0.4s ease-out;
        }

        @media (max-width: 640px) {
          table {
            font-size: 0.7rem;
          }
        }
      `}</style>
    </Navbar>
  );
}
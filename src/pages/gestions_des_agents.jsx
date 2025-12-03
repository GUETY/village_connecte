import React, { useState, useMemo, useEffect } from "react";
import Navbar from "../components/navbar";
import VoisinageLogo from "../layout/voisinage.jsx";
// Import de l'API axios
import { agentsAPI, setAuthToken } from "../services/api.js";
// import utilitaires image (déplacés)
import { compressImageToLimit, isImageFile } from "../utils/imageUtils.js";

/**
 * Page : Gestions des agents
 * - Création d'agents via formulaire
 * - Photo, Nom, Prénom, Identifiant, Mot de passe, Contact, Type de pièce, N° de pièce, Région
 * - Option : générer mot de passe à la première connexion
 * - Tableau avec actions Modifier/Supprimer avec animations et confirmations
 * - Filtre et pagination
 * - Design professionnel et animations
 */

function generatePassword() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/* --- Notification component --- */
function SuccessNotification({ message, onClose, type = "success" }) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
    info: "bg-blue-50 border-blue-200",
    delete: "bg-red-50 border-red-200",
  }[type];

  const textColor = {
    success: "text-green-700",
    error: "text-red-700",
    info: "text-blue-700",
    delete: "text-red-700",
  }[type];

  return (
    <div className={`fixed top-6 right-6 max-w-md p-4 rounded-lg border-2 ${bgColor} ${textColor} font-semibold text-sm shadow-lg animate-notifSlide z-50`}>
      {message}
    </div>
  );
}

/* Confirm dialog */
function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = "Oui", cancelLabel = "Non", isDangerous = false }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div 
        className="bg-white rounded-lg p-6 max-w-sm w-full shadow-2xl animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
        style={{ transform: "none" }}
      >
        <h2 className="text-lg font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all active:scale-95"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-white font-semibold transition-all active:scale-95 ${
              isDangerous
                ? "bg-red-500 hover:bg-red-600 border-2 border-red-600"
                : "bg-blue-500 hover:bg-blue-600 border-2 border-blue-600"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Deuxième étape : saisie du nom pour confirmer suppression (agents)
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
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl animate-scaleUp">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">Tapez exactement : <span className="font-semibold">{expectedName}</span> puis confirmez.</p>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full px-3 py-2 border rounded mb-2 focus:outline-none focus:ring-2 focus:ring-[#ff7a00]"
          placeholder="Entrez le nom ici"
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
            className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-all"
          >
            {isChecking ? "Vérification..." : "Confirmer suppression"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditAgentModal({ agent, regions, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    photo: agent.photo,
    nom: agent.nom,
    prenom: agent.prenom,
    identifiant: agent.identifiant,
    motDePasse: agent.motDePasse,
    contact: agent.contact,
    typePiece: agent.typePiece,
    numeroPiece: agent.numeroPiece,
    region: agent.region,
  });

  const [photoPreview, setPhotoPreview] = useState(agent.photo);
  const [showPasswordEdit, setShowPasswordEdit] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target.result);
        setFormData({ ...formData, photo: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nom || !formData.prenom || !formData.identifiant || !formData.contact || !formData.numeroPiece || !formData.region) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onCancel}>
      <div 
        className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-2xl animate-scaleUp my-8"
        onClick={(e) => e.stopPropagation()}
        style={{ transform: "none" }}
      >
        <h2 className="text-xl font-bold text-gray-900 mb-6">Modifier l'agent</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-lg border-2 border-[#ff7a00] flex items-center justify-center bg-gray-50 overflow-hidden" style={{ transform: "none" }}>
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="px-4 py-2 border-2 border-[#ff7a00] rounded-lg cursor-pointer text-sm"
            />
          </div>

          {/* Grille des champs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ transform: "none" }}>
            {/* Nom */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-2">Nom *</label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => handleInputChange("nom", e.target.value)}
                className="px-4 py-2 border-2 border-[#ff7a00] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff7a00] transition-all"
              />
            </div>

            {/* Prénom */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-2">Prénom *</label>
              <input
                type="text"
                value={formData.prenom}
                onChange={(e) => handleInputChange("prenom", e.target.value)}
                className="px-4 py-2 border-2 border-[#ff7a00] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff7a00] transition-all"
              />
            </div>

            {/* Identifiant */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-2">Identifiant (Login) *</label>
              <input
                type="text"
                value={formData.identifiant}
                onChange={(e) => handleInputChange("identifiant", e.target.value)}
                className="px-4 py-2 border-2 border-[#ff7a00] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff7a00] transition-all"
              />
            </div>

            {/* Contact */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-2">Contact (Téléphone) *</label>
              <input
                type="tel"
                value={formData.contact}
                onChange={(e) => handleInputChange("contact", e.target.value)}
                className="px-4 py-2 border-2 border-[#ff7a00] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff7a00] transition-all"
              />
            </div>

            {/* Type de pièce */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-2">Type de pièce *</label>
              <select
                value={formData.typePiece}
                onChange={(e) => handleInputChange("typePiece", e.target.value)}
                className="px-4 py-2 border-2 border-[#ff7a00] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff7a00] bg-white cursor-pointer transition-all"
              >
                <option value="CNI">CNI</option>
                <option value="Passeport">Passeport</option>
                <option value="Permis">Permis de conduire</option>
                <option value="Carte resident">Carte de résident</option>
              </select>
            </div>

            {/* Numéro de pièce */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-2">N° de pièce *</label>
              <input
                type="text"
                value={formData.numeroPiece}
                onChange={(e) => handleInputChange("numeroPiece", e.target.value)}
                className="px-4 py-2 border-2 border-[#ff7a00] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff7a00] transition-all"
              />
            </div>

            {/* Région */}
            <div className="flex flex-col md:col-span-2">
              <label className="text-sm font-semibold text-gray-700 mb-2">Région *</label>
              <select
                value={formData.region}
                onChange={(e) => handleInputChange("region", e.target.value)}
                className="px-4 py-2 border-2 border-[#ff7a00] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff7a00] bg-white cursor-pointer transition-all"
              >
                <option value="">Sélectionner une région</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.nom}>
                    {region.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-4 justify-end pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all active:scale-95"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#ff7a00] text-white font-bold rounded-lg hover:bg-[#ff9933] active:scale-95 shadow-md transition-all hover:shadow-lg"
            >
              ✓ Valider les modifications
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AgentForm({ onAddAgent, regions }) {
  // On définit à la fois les clés "anglais" attendues par la validation/back
  // et les alias français utilisés dans l'UI pour éviter les champs contrôlés/uncontrolled
  const [formData, setFormData] = useState({
    photo: null,

    // anglais (canoniques) — correspond au schéma back
    lastName: "",
    firstName: "",
    login: "",
    password: "",
    contact: "",
    idType: "CNI",
    idNumber: "",
    region: "",

    // alias français utilisés par l'UI (pour compatibilité)
    nom: "",
    prenom: "",
    identifiant: "",
    motDePasse: "",
    typePiece: "CNI",
    numeroPiece: "",
  });

  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null); // File pour l'envoi
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [generatePasswordFlag, setGeneratePasswordFlag] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Mise à jour intelligente : met à jour la clé fournie et ses alias/canonique associés
  const handleInputChange = (field, value) => {
    const v = value ?? "";
    const updates = {};

    // si on reçoit un alias français, on met aussi à jour la clé canonique
    if (field === "nom") {
      updates.nom = v;
      updates.lastName = v;
    } else if (field === "prenom") {
      updates.prenom = v;
      updates.firstName = v;
    } else if (field === "identifiant") {
      updates.identifiant = v;
      updates.login = v;
    } else if (field === "motDePasse") {
      updates.motDePasse = v;
      updates.password = v;
    } else if (field === "typePiece") {
      updates.typePiece = v;
      updates.idType = v;
    } else if (field === "numeroPiece") {
      updates.numeroPiece = v;
      updates.idNumber = v;
    } else {
      // si on reçoit la clé canonique, on met aussi à jour l'alias français correspondant
      updates[field] = v;
      if (field === "lastName") updates.nom = v;
      if (field === "firstName") updates.prenom = v;
      if (field === "login") updates.identifiant = v;
      if (field === "password") updates.motDePasse = v;
      if (field === "idType") updates.typePiece = v;
      if (field === "idNumber") updates.numeroPiece = v;
    }

    setFormData((prev) => ({ ...prev, ...updates }));
    // nettoyer erreur sur les deux variantes si présent
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(updates).forEach((k) => { next[k] = false; });
      return next;
    });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0] || null;
    setPhotoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target.result);
        // pour affichage uniquement ; formData.photo peut rester string (preview) ou vide
        setFormData((prev) => ({ ...prev, photo: event.target.result }));
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
      setFormData((prev) => ({ ...prev, photo: null }));
    }
  };

  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    // on met à jour les deux clés motDePasse et password
    handleInputChange("motDePasse", newPassword);
    setGeneratePasswordFlag(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // validation basée sur les clés canoniques (schéma Mongoose)
    const required = ["lastName", "firstName", "login", "password", "contact", "idNumber", "region"];
    const newErrors = {};
    required.forEach((k) => {
      const val = formData[k];
      if (!val || String(val).trim() === "") {
        newErrors[k] = true;
        // marque aussi l'alias français pour l'affichage
        if (k === "lastName") newErrors.nom = true;
        if (k === "firstName") newErrors.prenom = true;
        if (k === "login") newErrors.identifiant = true;
        if (k === "password") newErrors.motDePasse = true;
        if (k === "idNumber") newErrors.numeroPiece = true;
        if (k === "idType") newErrors.typePiece = true;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setErrorMessage("Veuillez remplir tous les champs obligatoires");
      setTimeout(() => setErrorMessage(""), 4000);
      // focus sur le premier champ canonique manquant (si présent dans DOM via data-field)
      const firstInvalid = required.find((k) => newErrors[k]) || Object.keys(newErrors)[0];
      const el = document.querySelector(`[data-field="${firstInvalid}"]`) || document.querySelector(`[data-field="${firstInvalidToAlias(firstInvalid)}"]`);
      el?.focus();
      return;
    }

    setSending(true);
    try {
      const fd = new FormData();
      fd.append("lastName", formData.lastName);
      fd.append("firstName", formData.firstName);
      fd.append("login", formData.login);
      fd.append("password", formData.password);
      fd.append("contact", formData.contact);
      fd.append("idType", formData.idType);
      fd.append("idNumber", formData.idNumber);
      fd.append("region", formData.region);

      if (photoFile && isImageFile(photoFile)) {
        try {
          const fileToSend = await compressImageToLimit(photoFile, {
            maxSizeBytes: 3 * 1024 * 1024,
            maxWidth: 1600,
          });
          if (fileToSend.size <= 10 * 1024 * 1024) {
            fd.append("photo", fileToSend, fileToSend.name);
          } else {
            fd.append("photo", "");
          }
        } catch {
          if (photoFile.size <= 10 * 1024 * 1024) fd.append("photo", photoFile, photoFile.name);
          else fd.append("photo", "");
        }
      } else {
        fd.append("photo", "");
      }

      const created = await agentsAPI.createMultipart(fd);
      onAddAgent(created);

      // reset en gardant toutes les clés (anglais + alias)
      setFormData({
        photo: null,
        lastName: "",
        firstName: "",
        login: "",
        password: "",
        contact: "",
        idType: "CNI",
        idNumber: "",
        region: "",
        nom: "",
        prenom: "",
        identifiant: "",
        motDePasse: "",
        typePiece: "CNI",
        numeroPiece: "",
      });
      setPhotoPreview(null);
      setPhotoFile(null);
      setGeneratePasswordFlag(false);
    } catch (err) {
      console.error("Erreur création agent :", err);
      setErrorMessage(err?.data?.message || "Erreur lors de la création");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setSending(false);
    }
  };

  // helper pour mapping inverse pour focus si nécessaire
  function firstInvalidToAlias(key) {
    if (key === "lastName") return "nom";
    if (key === "firstName") return "prenom";
    if (key === "login") return "identifiant";
    if (key === "password") return "motDePasse";
    if (key === "idNumber") return "numeroPiece";
    return key;
  }

  return (
    <div className="bg-white rounded-lg p-8 mb-8 border border-gray-200 shadow-sm overflow-hidden" style={{ transform: "none", perspective: "none" }}>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Créer un nouvel agent</h2>

      {errorMessage && (
        <div className="text-red-600 font-semibold text-sm mb-4">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-32 h-32 rounded-lg border-2 border-[#ff7a00] flex items-center justify-center bg-gray-50 overflow-hidden" style={{ transform: "none" }}>
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="px-4 py-2 border-2 border-[#ff7a00] rounded-lg cursor-pointer text-sm"
            disabled={sending}
          />
        </div>

        {/* -- Le reste des champs utilise handleInputChange avec les alias existants -- */}
        {/* Exemple Nom */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" style={{ transform: "none" }}>
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-2">Nom *</label>
            <input
              type="text"
              value={formData.nom}
              data-field="lastName"
              onChange={(e) => handleInputChange("nom", e.target.value)}
              className={`px-4 py-2 border-2 rounded-lg focus:outline-none transition-all ${errors.nom || errors.lastName ? "field-error animate-shake" : "border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]"}`}
              placeholder="Sai"
              aria-invalid={errors.nom || errors.lastName ? "true" : "false"}
            />
          </div>

          {/* Prénom */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-2">Prénom *</label>
            <input
              type="text"
              value={formData.prenom}
              data-field="firstName"
              onChange={(e) => handleInputChange("prenom", e.target.value)}
              className={`px-4 py-2 border-2 rounded-lg focus:outline-none transition-all ${errors.prenom || errors.firstName ? "field-error animate-shake" : "border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]"}`}
              placeholder="Emmanuella"
              aria-invalid={errors.prenom || errors.firstName ? "true" : "false"}
            />
          </div>

          {/* Identifiant */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-2">Identifiant (Login) *</label>
            <input
              type="text"
              value={formData.identifiant}
              data-field="login"
              onChange={(e) => handleInputChange("identifiant", e.target.value)}
              className={`px-4 py-2 border-2 rounded-lg focus:outline-none transition-all ${errors.identifiant || errors.login ? "field-error animate-shake" : "border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]"}`}
              placeholder="Désir"
              aria-invalid={errors.identifiant || errors.login ? "true" : "false"}
            />
          </div>

          {/* Mot de passe */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-2">Mot de passe *</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.motDePasse}
                data-field="password"
                onChange={(e) => handleInputChange("motDePasse", e.target.value)}
                className={`w-full pr-28 px-4 py-2 border-2 rounded-lg focus:outline-none transition-all ${errors.motDePasse || errors.password ? "field-error animate-shake" : "border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]"}`}
                placeholder="••••••••"
                aria-invalid={errors.motDePasse || errors.password ? "true" : "false"}
              />
              <div className="absolute inset-y-0 right-2 flex items-center gap-2">
                <button type="button" onClick={() => setShowPassword((s) => !s)} className="p-1.5 bg-white rounded-md text-gray-700 hover:bg-gray-50 border border-transparent hover:border-gray-200 transition" aria-pressed={showPassword}>
                  {showPassword ? "👁" : "🙈"}
                </button>
                <button type="button" onClick={handleGeneratePassword} className="px-2 py-1.5 bg-[#ff7a00] text-white rounded-md font-semibold hover:bg-[#ff9933] active:scale-95 transition text-sm" title="Générer un mot de passe">🔒</button>
              </div>
            </div>
            {generatePasswordFlag && <p className="text-xs text-green-600 mt-1">✓ Le mot de passe sera généré à la première connexion</p>}
          </div>

          {/* Contact */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-2">Contact (Téléphone) *</label>
            <input
              type="tel"
              value={formData.contact}
              data-field="contact"
              onChange={(e) => handleInputChange("contact", e.target.value)}
              className={`px-4 py-2 border-2 rounded-lg focus:outline-none transition-all ${errors.contact ? "field-error animate-shake" : "border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]"}`}
              placeholder="0102130205"
              aria-invalid={errors.contact ? "true" : "false"}
            />
          </div>

          {/* Type de pièce */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-2">Type de pièce *</label>
            <select value={formData.typePiece} onChange={(e) => handleInputChange("typePiece", e.target.value)} className="px-4 py-2 border-2 border-[#ff7a00] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff7a00] bg-white cursor-pointer transition-all">
              <option value="CNI">CNI</option>
              <option value="Passeport">Passeport</option>
              <option value="Permis">Permis de conduire</option>
              <option value="Carte resident">Carte de résident</option>
            </select>
          </div>

          {/* Numéro de pièce */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-2">N° de pièce *</label>
            <input
              type="text"
              value={formData.numeroPiece}
              data-field="idNumber"
              onChange={(e) => handleInputChange("numeroPiece", e.target.value)}
              className={`px-4 py-2 border-2 rounded-lg focus:outline-none transition-all ${errors.numeroPiece || errors.idNumber ? "field-error animate-shake" : "border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]"}`}
              placeholder="123456789"
              aria-invalid={errors.numeroPiece || errors.idNumber ? "true" : "false"}
            />
          </div>

          {/* Région */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-2">Région *</label>
            <select value={formData.region} data-field="region" onChange={(e) => handleInputChange("region", e.target.value)} className={`px-4 py-2 border-2 rounded-lg focus:outline-none transition-all ${errors.region ? "field-error animate-shake" : "border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]"} bg-white cursor-pointer`} aria-invalid={errors.region ? "true" : "false"}>
              <option value="">Sélectionner une région</option>
              {regions.map((region) => (
                <option key={region.id} value={region.nom}>
                  {region.nom}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bouton Créer */}
        <div className="flex justify-center pt-4">
          <button type="submit" disabled={sending} className="px-8 py-3 bg-[#ff7a00] text-white font-bold text-lg rounded-lg hover:bg-[#ff9933] active:scale-95 shadow-md transition-all hover:shadow-lg">
            {sending ? "Envoi..." : "+ Créer agent"}
          </button>
        </div>
      </form>
    </div>
  );
}

function AgentTable({ agents, onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState(null);
  const [deletingIndex, setDeletingIndex] = useState(null);
  const [showNameConfirm, setShowNameConfirm] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifMessage, setNotifMessage] = useState("");
  const [notifType, setNotifType] = useState("success");
  const [editingIndex, setEditingIndex] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Filtrage par recherche
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return agents;
    return agents.filter((agent) => {
      return (
        (agent.lastName || "").toLowerCase().includes(q) ||
        (agent.firstName || "").toLowerCase().includes(q) ||
        (agent.login || "").toLowerCase().includes(q) ||
        (agent.contact || "").toLowerCase().includes(q) ||
        ((agent.region || "")).toLowerCase().includes(q)
      );
    });
  }, [agents, search]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (page > totalPages) setPage(1);
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  // Demande de suppression
  function requestDelete(index) {
    setPendingDeleteIndex(index);
    setShowDeleteConfirm(true);
  }

  // Après première confirmation : basculer vers la saisie du nom
  function proceedToNameConfirm() {
    setShowDeleteConfirm(false);
    setShowNameConfirm(true);
  }

  // Confirmation finale après saisie correcte du nom
  function confirmDeleteByName() {
    const index = pendingDeleteIndex;
    setShowNameConfirm(false);
    if (index !== null) {
      setDeletingIndex(index);
      setTimeout(() => {
        onDelete(index);
        setDeletingIndex(null);
        setNotifMessage(`✓ Agent ${agents[index].prenom} ${agents[index].nom} supprimé avec succès`);
        setNotifType("delete");
        setShowNotif(true);
      }, 600);
    }
    setPendingDeleteIndex(null);
  }

  function cancelDelete() {
    setShowDeleteConfirm(false);
    setShowNameConfirm(false);
    setPendingDeleteIndex(null);
  }

  // Gestion de la modification
  function requestEdit(index) {
    setEditingIndex(index);
  }

  function handleEditSave(formData) {
    onEdit(editingIndex, formData);
    setEditingIndex(null);
    setNotifMessage(`✓ Agent ${formData.prenom} ${formData.nom} modifié avec succès`);
    setNotifType("success");
    setShowNotif(true);
  }

  function cancelEdit() {
    setEditingIndex(null);
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300" style={{ transform: "none", perspective: "none" }}>
      {/* Controls: Afficher X entrées + Recherche */}
      <div className="bg-gradient-to-r from-gray-50 to-white p-4 md:p-6 border-b border-gray-200 space-y-3 md:space-y-0" style={{ transform: "none" }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Groupe gauche : Affichage */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg border border-orange-200">
                <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
              </div>
              <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Afficher</label>
            </div>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="px-3 py-2 border-2 border-orange-300 rounded-lg text-sm font-semibold bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent hover:border-orange-400 transition-all cursor-pointer shadow-sm"
              aria-label="Nombre d'entrées"
            >
              {[5, 10, 15, 20, 50].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">entrées</span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-xs font-bold border border-orange-200">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1 1 0 11-3 0 1.5 1.5 0 013 0z" />
              </svg>
              {total}
            </span>
          </div>

          {/* Groupe droit : Recherche */}
          <div className="w-full md:w-auto">
            <div className="relative group">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-green-500 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="search-agent"
                type="search"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 border-2 border-green-300 rounded-lg text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent hover:border-green-400 transition-all shadow-sm hover:shadow-md"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  aria-label="Effacer la recherche"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tableau - SANS SCROLL HORIZONTAL */}
      <div style={{ transform: "none", perspective: "none" }}>
        <table 
          className="w-full divide-y divide-gray-200" 
          role="table" 
          aria-label="Tableau des agents"
          style={{ transform: "none", perspective: "none" }}
        >
          <caption className="sr-only">Liste des agents avec actions de modification et suppression</caption>
          <thead className="bg-gradient-to-r from-orange-500 to-orange-600 text-white sticky top-0 z-10">
            <tr style={{ transform: "none" }}>
              <th className="px-4 md:px-5 py-3.5 text-left text-xs md:text-sm font-bold whitespace-nowrap">Photo</th>
              <th className="px-4 md:px-5 py-3.5 text-left text-xs md:text-sm font-bold whitespace-nowrap">Nom</th>
              <th className="px-4 md:px-5 py-3.5 text-left text-xs md:text-sm font-bold whitespace-nowrap">Prénom</th>
              <th className="px-4 md:px-5 py-3.5 text-left text-xs md:text-sm font-bold whitespace-nowrap">Login</th>
              <th className="px-4 md:px-5 py-3.5 text-left text-xs md:text-sm font-bold whitespace-nowrap">Contact</th>
              <th className="px-4 md:px-5 py-3.5 text-left text-xs md:text-sm font-bold whitespace-nowrap">Région</th>
              <th className="px-4 md:px-5 py-3.5 text-center text-xs md:text-sm font-bold whitespace-nowrap">Actions</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-100">
            {paginated.length > 0 ? (
              paginated.map((agent, idx) => {
                const actualIndex = start + idx;
                const isDeleting = deletingIndex === actualIndex;
                
                return (
                  <tr 
                    key={actualIndex} 
                    className={`transition-all duration-300 animate-fadeIn ${
                      isDeleting ? "delete-row" : "hover:bg-orange-50/50"
                    }`}
                    style={{ animationDelay: `${idx * 50}ms`, transform: "none" }}
                  >
                    <td className="px-4 md:px-5 py-3.5 align-middle">
                      <div className="w-11 h-11 rounded-lg border-2 border-orange-300 overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ transform: "none" }}>
                        {agent.photo ? (
                          <img src={agent.photo} alt={agent.nom} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 md:px-5 py-3.5 align-middle font-semibold text-gray-900 text-sm">
                      {agent.lastName}
                    </td>
                    <td className="px-4 md:px-5 py-3.5 align-middle text-gray-700 text-sm">
                      {agent.firstName}
                    </td>
                    <td className="px-4 md:px-5 py-3.5 align-middle text-sm">
                      <code className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md inline-block border border-purple-200">
                        {agent.login}
                      </code>
                    </td>
                    <td className="px-4 md:px-5 py-3.5 align-middle text-gray-700 text-sm font-medium">
                      {agent.contact}
                    </td>
                    <td className="px-4 md:px-5 py-3.5 align-middle text-gray-700 text-sm">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-xs font-bold border border-orange-200">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        {agent.region}
                      </span>
                    </td>
                    <td className="px-4 md:px-5 py-3.5 align-middle">
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <button
                          onClick={() => requestEdit(actualIndex)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 active:scale-95 transition-all text-xs whitespace-nowrap border border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md button-hover"
                          title="Modifier"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        Modifier
                        </button>
                        <button
                          onClick={() => requestDelete(actualIndex)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-100 active:scale-95 transition-all text-xs whitespace-nowrap border border-red-200 hover:border-red-300 shadow-sm hover:shadow-md button-hover"
                          title="Supprimer"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center" style={{ transform: "none" }}>
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-gray-100 rounded-full">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3.623a1.003 1.003 0 01-.898-1.479l2.14-5.001A5.991 5.991 0 0112 13c2.071 0 3.998.78 5.44 2.055l2.14 5.001a1.003 1.003 0 01-.898 1.479H21" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-semibold">Aucun agent trouvé</p>
                    <p className="text-xs text-gray-500">Créez un nouvel agent ou ajustez vos critères de recherche</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination - Stylisée */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 md:p-5 border-t border-gray-200 bg-gray-50" style={{ transform: "none" }}>
        <div className="text-xs md:text-sm font-semibold text-gray-600">
          Affichage <span className="text-gray-900">{total === 0 ? 0 : start + 1}–{Math.min(start + paginated.length, total)}</span> sur <span className="text-gray-900">{total}</span>
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

          <span className="px-3 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-bold border border-orange-200 whitespace-nowrap">
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

      {/* Confirm dialog pour suppression */}
      {/* étape 1 : confirmation basique */}
      {showDeleteConfirm && pendingDeleteIndex !== null && (
        <ConfirmDialog
          title="Confirmer la suppression"
          message={`Êtes-vous sûr de vouloir supprimer l'agent ${agents[pendingDeleteIndex]?.prenom} ${agents[pendingDeleteIndex]?.nom} ? Cette action est irréversible.`}
          onConfirm={proceedToNameConfirm}
          onCancel={cancelDelete}
          confirmLabel="Oui, continuer"
          cancelLabel="Annuler"
          isDangerous={true}
        />
      )}

      {/* étape 2 : saisie du nom pour confirmer */}
      {showNameConfirm && pendingDeleteIndex !== null && (
        <NameConfirmDialog
          title="Confirmer la suppression (saisie du nom)"
          expectedName={`${agents[pendingDeleteIndex]?.prenom} ${agents[pendingDeleteIndex]?.nom}`}
          onConfirmName={confirmDeleteByName}
          onCancel={cancelDelete}
        />
      )}

      {/* Modal de modification */}
      {editingIndex !== null && (
        <EditAgentModal
          agent={agents[editingIndex]}
          regions={[
            { id: 1, nom: "Bouna" },
            { id: 2, nom: "Yamoussoukro" },
            { id: 3, nom: "Abidjan" },
            { id: 4, nom: "Daloa" },
          ]}
          onSave={handleEditSave}
          onCancel={cancelEdit}
        />
      )}

      {/* Notification */}
      {showNotif && (
        <SuccessNotification
          message={notifMessage}
          onClose={() => setShowNotif(false)}
          type={notifType}
        />
      )}

      {showSuccessMessage && (
        <div className="fixed top-6 right-6 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-notifSlide z-50">
          Agent créé avec succès !
        </div>
      )}
    </div>
  );
}

export default function GestionsDesAgents() {
  const regions = [
    { id: 1, nom: "Bouna" },
    { id: 2, nom: "Yamoussoukro" },
    { id: 3, nom: "Abidjan" },
    { id: 4, nom: "Daloa" },
  ];

  // état des agents initial vide -> on charge depuis l'API au montage
  const [agents, setAgents] = useState([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Au montage : appliquer le token (si présent) et charger la liste depuis l'API
  useEffect(() => {
    const token = localStorage.getItem("village_token");
    if (token) setAuthToken(token);

    let mounted = true;
    agentsAPI
      .list()
      .then((data) => {
        if (!mounted) return;
        // adapter selon format renvoyé par l'API : tableau direct ou { data: [...] }
        const list = Array.isArray(data) ? data : data?.data || [];
        setAgents(list);
      })
      .catch((err) => {
        console.error("Erreur chargement agents depuis API :", err);
        // on garde la liste vide en fallback
      });
    return () => (mounted = false);
  }, []);

  // Ajout d'un agent : envoi à l'API puis ajout à l'état
  const handleAddAgent = (createdAgent) => {
    // crééAgent doit correspondre au schéma (lastName, firstName, login, ...)
    setAgents((prev) => [...prev, createdAgent]);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 4000);
  };

  // Modification d'un agent : envoi update si id présent sinon mise à jour locale
  const handleEditAgent = async (index, formData) => {
    const id = agents[index]?.id;
    if (id) {
      try {
        const updated = await agentsAPI.update(id, formData);
        setAgents((prev) => {
          const copy = [...prev];
          copy[index] = updated;
          return copy;
        });
      } catch (err) {
        console.error("Erreur mise à jour agent :", err);
      }
    } else {
      // fallback local si pas d'id
      const updatedAgents = [...agents];
      updatedAgents[index] = formData;
      setAgents(updatedAgents);
    }
  };

  // Suppression d'un agent : appel API si id disponible, puis suppression locale
  const handleDeleteAgent = async (index) => {
    const agent = agents[index];
    const id = agent?._id || agent?.id; // support _id ou id

    // Assurer que le token est défini
    const token = localStorage.getItem("village_token");
    if (token) setAuthToken(token);

    // Si pas d'id, suppression locale (fallback)
    if (!id) {
      setAgents((prev) => prev.filter((_, i) => i !== index));
      return;
    }

    // suppression optimiste : retirer immédiatement de l'UI puis appeler l'API
    const previous = [...agents];
    setAgents((prev) => prev.filter((_, i) => i !== index));

    try {
      await agentsAPI.remove(id);
      // optionnel: afficher message de succès global
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 4000);
    } catch (err) {
      // rollback si erreur
      console.error("Erreur suppression agent :", err);
      setAgents(previous);
      // afficher erreur utilisateur
      // si vous avez un système de notifications global, utilisez-le ; sinon utilisez console.error
      alert(err?.data?.message || "Erreur lors de la suppression de l'agent. Veuillez réessayer.");
    }
  };

  return (
    <Navbar>
      <VoisinageLogo />

      {/* Ajout de padding-top pour éviter que le contenu soit masqué par le header */}
      <main className="max-w-7xl mx-auto px-6 py-8 font-sans antialiased text-gray-800 bg-white rounded-lg shadow-md pt-20">
        <section>
          {/* Formulaire de création */}
          <AgentForm onAddAgent={handleAddAgent} regions={regions} />

          {/* Tableau des agents */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Liste des agents</h2>
            <AgentTable agents={agents} onEdit={handleEditAgent} onDelete={handleDeleteAgent} />
          </div>
        </section>

        {/* Message de succès */}
        {showSuccessMessage && (
          <div className="fixed top-6 right-6 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-notifSlide z-50">
            Agent créé avec succès !
          </div>
        )}
      </main>
    </Navbar>
  );
}

/* CSS pour animations */
<style>{`
  @keyframes notifSlide {
    from { opacity: 0; transform: translateY(-12px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .animate-notifSlide { animation: notifSlide 320ms cubic-bezier(.2,.8,.2,1) both; }

  .button-hover {
    position: relative;
    overflow: hidden;
  }
  .button-hover::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255,255,255,0.3);
    transform: translate(-50%, -50%);
    transition: width 0.5s, height 0.5s;
  }
  .button-hover:active::after {
    width: 100%;
    height: 100%;
  }

  /* Champ requis non renseigné : bord rouge + secousse */
  .field-error {
    border-color: #ef4444 !important; /* rouge */
    box-shadow: 0 6px 18px rgba(239,68,68,0.08);
  }
  @keyframes shake {
    0% { transform: translateX(0); }
    20% { transform: translateX(-6px); }
    40% { transform: translateX(6px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
    100% { transform: translateX(0); }
  }
  .animate-shake {
    animation: shake 560ms cubic-bezier(.36,.07,.19,.97);
  }
`}</style>